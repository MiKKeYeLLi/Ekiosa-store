import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import {
  COUNTRIES,
  EMPTY_CHECKOUT_FORM,
  US_STATES,
  postalLabel,
  regionLabel,
  validateAll,
  validateField,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutFormValues,
} from "@ekiosa/shared/checkout-validation";
import { addBusinessDays, formatPrice } from "@ekiosa/shared/format";
import { SHIPPING_METHODS, getShippingCost } from "@ekiosa/shared/pricing";
import type { ShippingMethodId } from "@ekiosa/shared/types";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/bits";
import { Checkbox, Input } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/auth";
import { cartTotals, useCart } from "@/lib/cart-store";
import { OrderError, orderKeys, placeOrder } from "@/lib/orders";
import { registerForPushNotifications } from "@/lib/push";
import { colors, fonts, GUTTER, radius } from "@/theme";

const LABELS: Partial<Record<CheckoutField, string>> = {
  firstName: "First name",
  lastName: "Last name",
  address1: "Address",
  city: "City",
  region: "State / region",
  postalCode: "Postal code",
  phone: "Phone",
  country: "Country",
};

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, ready } = useSession();
  const { lines, promo, clear } = useCart();
  const [method, setMethod] = useState<ShippingMethodId>("standard");
  const totals = cartTotals(lines, promo, method);
  const [values, setValues] = useState<CheckoutFormValues>(EMPTY_CHECKOUT_FORM);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);

  // Prefill from the Google account once the session loads.
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (!user || prefilled) return;
    const [first = "", ...rest] = (user.fullName ?? "").split(/\s+/).filter(Boolean);
    setValues((v) => ({ ...v, email: user.email, firstName: v.firstName || first, lastName: v.lastName || rest.join(" ") }));
    setPrefilled(true);
  }, [user, prefilled]);

  if (ready && !user) return <Redirect href={{ pathname: "/sign-in", params: { next: "/checkout" } }} />;
  if (ready && !lines.length && !submitting) return <Redirect href="/bag" />;

  function set<K extends CheckoutField>(field: K, value: CheckoutFormValues[K]) {
    const next = { ...values, [field]: value };
    if (field === "country") next.region = "";
    setValues(next);
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, next) }));
  }
  const blur = (field: CheckoutField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, values) }));
  };
  const field = (f: Exclude<CheckoutField, "marketingOptIn">) => ({
    value: values[f],
    onChangeText: (t: string) => set(f, t),
    onBlur: () => blur(f),
    error: touched[f] ? errors[f] : undefined,
    editable: !submitting,
  });

  async function submit() {
    const all = validateAll(values);
    setErrors(all);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    const bad = Object.keys(all);
    if (bad.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSubmitError(`Please fix: ${bad.map((k) => LABELS[k as CheckoutField] ?? k).join(", ")}.`);
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await placeOrder({ values, shippingMethodId: method, lines, promo, simulateFailure });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: ["products"] });
      router.replace({ pathname: "/order/[id]", params: { id: order.orderId, placed: "1" } });
      clear();
      registerForPushNotifications(); // ask after a meaningful moment, not at launch
    } catch (err) {
      setSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const e = err instanceof OrderError ? err : new OrderError("Something went wrong. Please try again.", "unknown");
      if (e.code === "unauthenticated") {
        router.push({ pathname: "/sign-in", params: { next: "/checkout" } });
        return;
      }
      setSubmitError(e.message);
      toast({
        tone: "error",
        title: e.code === "payment_declined" ? "Payment failed" : e.code === "out_of_stock" ? "Stock changed" : "Order not placed",
        description: e.code === "out_of_stock" ? "Please review your bag." : "Your order wasn't placed.",
        action: e.code === "out_of_stock" ? { label: "Review bag", onPress: () => router.navigate("/bag") } : undefined,
      });
      scroll.current?.scrollTo({ y: 0, animated: true });
    }
  }

  const isUS = values.country === "US";
  const discounted = totals.subtotal - totals.discount;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: GUTTER, paddingBottom: 140, gap: 28 }} keyboardShouldPersistTaps="handled">
        {submitError && (
          <View style={styles.error} accessibilityRole="alert">
            <Feather name="x-circle" size={18} color={colors.danger} />
            <Text style={{ flex: 1, color: colors.danger, fontSize: 14 }}>{submitError}</Text>
          </View>
        )}

        {/* Summary */}
        <View style={styles.card}>
          {lines.map((l) => (
            <View key={l.productId} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <ProductImage src={l.image} width={44} style={{ width: 44, height: 54, borderRadius: 8 }} />
              <Text variant="caption" numberOfLines={2} style={{ flex: 1, color: colors.ink }}>
                {l.quantity} × {l.name}
              </Text>
              <Text variant="label">{formatPrice(l.unitPrice * l.quantity)}</Text>
            </View>
          ))}
          <Divider style={{ marginVertical: 8 }} />
          <SummaryRow label="Subtotal" value={formatPrice(totals.subtotal)} />
          {totals.discount > 0 && <SummaryRow label={`Discount (${promo?.code})`} value={`−${formatPrice(totals.discount)}`} />}
          <SummaryRow label="Shipping" value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)} />
          <SummaryRow label="Estimated tax" value={formatPrice(totals.tax)} />
          <SummaryRow label="Total" value={formatPrice(totals.total)} strong />
        </View>

        <Step n={1} title="Contact">
          <View style={styles.signedIn}>
            {user?.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} /> : <Feather name="user" size={20} color={colors.inkMuted} />}
            <View style={{ flex: 1 }}>
              <Text variant="label" numberOfLines={1}>
                {user?.fullName ?? "Signed in"}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
          <Input label="Phone" optional keyboardType="phone-pad" autoComplete="tel" hint="For delivery updates only." {...field("phone")} />
          <Checkbox label="Email me about new arrivals and offers" checked={values.marketingOptIn} onChange={(v) => set("marketingOptIn", v)} />
        </Step>

        <Step n={2} title="Shipping address">
          <Picker label="Country" value={COUNTRIES.find((c) => c.value === values.country)?.label ?? ""} open={countryOpen} setOpen={setCountryOpen} options={COUNTRIES} onPick={(v) => set("country", v)} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Input label="First name" autoComplete="given-name" containerStyle={{ flex: 1 }} {...field("firstName")} />
            <Input label="Last name" autoComplete="family-name" containerStyle={{ flex: 1 }} {...field("lastName")} />
          </View>
          <Input label="Address" autoComplete="street-address" placeholder="Street address" {...field("address1")} />
          <Input label="Apartment, suite, etc." optional {...field("address2")} />
          <Input label="City" autoComplete="postal-address-locality" {...field("city")} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            {isUS ? (
              <View style={{ flex: 1 }}>
                <Picker
                  label={regionLabel(values.country)}
                  value={values.region}
                  placeholder="Select"
                  open={regionOpen}
                  setOpen={setRegionOpen}
                  options={US_STATES}
                  onPick={(v) => {
                    set("region", v);
                    setTouched((t) => ({ ...t, region: true }));
                    setErrors((e) => ({ ...e, region: undefined }));
                  }}
                  error={touched.region ? errors.region : undefined}
                />
              </View>
            ) : (
              <Input label={regionLabel(values.country)} containerStyle={{ flex: 1 }} {...field("region")} />
            )}
            <Input label={postalLabel(values.country)} keyboardType={isUS ? "number-pad" : "default"} autoComplete="postal-code" autoCapitalize="characters" containerStyle={{ flex: 1 }} {...field("postalCode")} />
          </View>
        </Step>

        <Step n={3} title="Delivery method">
          {SHIPPING_METHODS.map((m) => {
            const on = method === m.id;
            const cost = getShippingCost(m, discounted);
            const from = addBusinessDays(new Date(), m.minDays).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            const to = addBusinessDays(new Date(), m.maxDays).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            return (
              <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ checked: on }} disabled={submitting} onPress={() => setMethod(m.id)} style={[styles.method, on && styles.methodOn]}>
                <View style={[styles.radio, on && { borderColor: colors.ink, backgroundColor: colors.ink }]}>{on && <View style={styles.radioDot} />}</View>
                <View style={{ flex: 1 }}>
                  <Text variant="label">
                    {m.name} <Text variant="caption">· {m.description}</Text>
                  </Text>
                  <Text variant="caption">Arrives {m.minDays === m.maxDays ? from : `${from} – ${to}`}</Text>
                </View>
                <Text style={{ fontFamily: fonts.medium, color: cost === 0 ? colors.success : colors.ink }}>{cost === 0 ? "Free" : formatPrice(cost)}</Text>
              </Pressable>
            );
          })}
        </Step>

        <Step n={4} title="Payment">
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Feather name="credit-card" size={17} color={colors.ink} />
              <Text variant="label">Card</Text>
            </View>
            {["1234 1234 1234 1234", "MM / YY       CVC"].map((p) => (
              <View key={p} style={styles.fakeField}>
                <Text style={{ color: colors.inkFaint }}>{p}</Text>
              </View>
            ))}
            <View style={styles.notice}>
              <Feather name="lock" size={13} color={colors.brand} />
              <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.brand }}>
                Payment processing isn&apos;t connected yet. No card details are collected — placing an order creates a demo order.
              </Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <Checkbox label="Simulate a declined payment" description="Demo only — previews the error state." checked={simulateFailure} onChange={setSimulateFailure} disabled={submitting} />
            </View>
          </View>
        </Step>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={submitting ? "Placing order…" : `Place order · ${formatPrice(totals.total)}`}
          size="lg"
          loading={submitting}
          icon={<Feather name="lock" size={15} color={colors.white} />}
          onPress={submit}
          style={{ alignSelf: "stretch" }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={styles.stepNum}>
          <Text style={{ color: colors.white, fontFamily: fonts.semibold, fontSize: 12 }}>{n}</Text>
        </View>
        <Text variant="heading" style={{ fontSize: 19 }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: strong ? 6 : 0 }}>
      <Text style={{ fontSize: strong ? 16 : 14, fontFamily: strong ? fonts.semibold : fonts.regular, color: strong ? colors.ink : colors.inkMuted }}>{label}</Text>
      <Text style={{ fontSize: strong ? 16 : 14, fontFamily: strong ? fonts.semibold : fonts.regular, color: colors.ink }}>{value}</Text>
    </View>
  );
}

/** Simple inline picker (expands a list) — avoids a native picker dependency. */
function Picker({
  label,
  value,
  placeholder,
  open,
  setOpen,
  options,
  onPick,
  error,
}: {
  label: string;
  value: string;
  placeholder?: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  options: { value: string; label: string }[];
  onPick: (v: string) => void;
  error?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.inkSoft }}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[styles.select, !!error && { borderColor: colors.danger }]}>
        <Text style={{ color: value ? colors.ink : colors.inkFaint, fontSize: 15.5 }}>{value || placeholder}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={17} color={colors.inkMuted} />
      </Pressable>
      {error ? <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text> : null}
      {open && (
        <ScrollView style={styles.options} nestedScrollEnabled>
          {options.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => {
                onPick(o.value);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.subtle }]}
            >
              <Text style={{ fontSize: 15, color: colors.ink }}>{o.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  error: { flexDirection: "row", gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.dangerTint },
  signedIn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.subtle },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  method: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  methodOn: { borderColor: colors.ink, borderWidth: 2, padding: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  fakeField: { height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.subtle, justifyContent: "center", paddingHorizontal: 14, marginBottom: 10 },
  notice: { flexDirection: "row", gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.brandTint },
  select: { height: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  options: { maxHeight: 220, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface },
  option: { paddingVertical: 12, paddingHorizontal: 14 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
