import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { getCategoryName } from "@ekiosa/shared/categories";
import { formatPrice, LOW_STOCK_THRESHOLD, pluralize } from "@ekiosa/shared/format";
import { FREE_SHIPPING_THRESHOLD, lookupPromoCode } from "@ekiosa/shared/pricing";
import type { CartLine } from "@ekiosa/shared/types";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Divider, EmptyState } from "@/components/ui/bits";
import { QuantitySelector } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/auth";
import { cartTotals, selectItemCount, useCart } from "@/lib/cart-store";
import { colors, fonts, GUTTER, radius } from "@/theme";

export default function BagScreen() {
  const insets = useSafeAreaInsets();
  const { lines, promo, hydrated } = useCart();
  const count = useCart(selectItemCount);
  const { user } = useSession();
  const totals = cartTotals(lines, promo, "standard", false);
  const discounted = totals.subtotal - totals.discount;

  if (!hydrated) return null;

  if (!lines.length) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40 }}>
        <EmptyState
          icon="shopping-bag"
          title="Your bag is empty"
          description="Looks like you haven't added anything yet."
          action={
            <>
              <Button title="Start shopping" onPress={() => router.navigate("/shop")} />
              <Button title="Shop the sale" variant="outline" onPress={() => router.navigate({ pathname: "/shop", params: { sale: "1" } })} />
            </>
          }
        />
      </View>
    );
  }

  const goToCheckout = () => (user ? router.push("/checkout") : router.push({ pathname: "/sign-in", params: { next: "/checkout" } }));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}>
        <View style={styles.title}>
          <Text variant="display" style={{ fontSize: 36 }}>
            Your bag
          </Text>
          <Text variant="caption">{pluralize(count, "item")}</Text>
        </View>
        <Text variant="caption" style={{ paddingHorizontal: GUTTER, marginBottom: 6 }}>
          Swipe left on an item to remove it.
        </Text>

        <View>
          {lines.map((line) => (
            <BagLine key={line.productId} line={line} />
          ))}
        </View>

        <View style={{ paddingHorizontal: GUTTER, gap: 18, marginTop: 20 }}>
          <FreeShipping amount={discounted} />
          <PromoField />
          <Divider />
          <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
          {totals.discount > 0 && <Row label={`Promo (${promo?.code})`} value={`−${formatPrice(totals.discount)}`} valueColor={colors.success} />}
          <Row label="Shipping estimate" value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)} />
          <Row label="Tax" value="Calculated at checkout" valueColor={colors.inkMuted} />
          {totals.savings + totals.discount > 0 && (
            <Text style={{ alignSelf: "flex-end", fontFamily: fonts.medium, fontSize: 13, color: colors.sale }}>You&apos;re saving {formatPrice(totals.savings + totals.discount)}</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text variant="caption">Estimated total</Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 20, color: colors.ink }}>{formatPrice(totals.total)}</Text>
        </View>
        <Button title="Checkout" size="lg" icon={<Feather name="lock" size={15} color={colors.white} />} onPress={goToCheckout} style={{ minWidth: 170 }} />
      </View>
    </View>
  );
}

function BagLine({ line }: { line: CartLine }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const { toast } = useToast();

  const doRemove = () => {
    const removed = remove(line.productId);
    if (!removed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toast({ tone: "info", title: "Removed from bag", description: removed.name, image: removed.image, action: { label: "Undo", onPress: () => restore(removed) }, duration: 5000 });
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={(direction) => direction === "left" && doRemove()}
      renderRightActions={() => (
        <View style={styles.swipeAction}>
          <Feather name="trash-2" size={20} color={colors.white} />
          <Text style={{ color: colors.white, fontFamily: fonts.medium, fontSize: 12 }}>Remove</Text>
        </View>
      )}
    >
      <View style={styles.line}>
        <Link href={{ pathname: "/product/[slug]", params: { slug: line.slug } }} asChild>
          <Pressable accessibilityLabel={line.name}>
            <ProductImage src={line.image} width={88} style={{ width: 88, height: 110, borderRadius: radius.md }} />
          </Pressable>
        </Link>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={{ fontSize: 12 }}>
                {getCategoryName(line.category)}
              </Text>
              <Text variant="label" numberOfLines={2}>
                {line.name}
              </Text>
            </View>
            <Text variant="label">{formatPrice(line.unitPrice * line.quantity)}</Text>
          </View>
          <Text variant="caption">
            {formatPrice(line.unitPrice)}
            {line.compareAtPrice && line.compareAtPrice > line.unitPrice ? `  ·  was ${formatPrice(line.compareAtPrice)}` : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <QuantitySelector size="sm" value={line.quantity} max={line.maxQuantity} onChange={(q) => setQuantity(line.productId, q)} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${line.name}`} hitSlop={8} onPress={doRemove}>
              <Feather name="trash-2" size={18} color={colors.inkMuted} />
            </Pressable>
          </View>
          {line.maxQuantity <= LOW_STOCK_THRESHOLD && (
            <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: colors.warning }}>
              {line.quantity >= line.maxQuantity ? `Max reached — only ${line.maxQuantity} in stock` : `Only ${line.maxQuantity} left in stock`}
            </Text>
          )}
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}

function FreeShipping({ amount }: { amount: number }) {
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - amount, 0);
  const pct = Math.min((amount / FREE_SHIPPING_THRESHOLD) * 100, 100);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Feather name="truck" size={15} color={colors.brand} />
        <Text variant="caption" style={{ color: remaining ? colors.inkSoft : colors.success, fontFamily: remaining ? fonts.regular : fonts.medium }}>
          {remaining ? `You're ${formatPrice(remaining)} away from free shipping` : "You've unlocked free standard shipping"}
        </Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function PromoField() {
  const promo = useCart((s) => s.promo);
  const applyPromo = useCart((s) => s.applyPromo);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (promo) {
    return (
      <View style={styles.promoApplied}>
        <Feather name="tag" size={15} color={colors.success} />
        <Text style={{ flex: 1, color: colors.success, fontSize: 14 }}>
          <Text style={{ fontFamily: fonts.semibold, color: colors.success }}>{promo.code}</Text> · {promo.label}
        </Text>
        <Pressable accessibilityLabel={`Remove promo ${promo.code}`} hitSlop={8} onPress={() => applyPromo(null)}>
          <Feather name="x" size={17} color={colors.success} />
        </Pressable>
      </View>
    );
  }

  const apply = () => {
    if (!code.trim()) return setError("Enter a promo code.");
    const found = lookupPromoCode(code);
    if (!found) return setError("That code isn't valid or has expired.");
    applyPromo(found);
    setCode("");
    setError(null);
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.toUpperCase());
            setError(null);
          }}
          autoCapitalize="characters"
          placeholder="Promo code"
          placeholderTextColor={colors.inkFaint}
          onSubmitEditing={apply}
          accessibilityLabel="Promo code"
          style={[styles.promoInput, error ? { borderColor: colors.danger } : null]}
        />
        <Button title="Apply" variant="outline" onPress={apply} />
      </View>
      {error ? <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text> : <Text variant="caption">Try WELCOME10</Text>}
    </View>
  );
}

function Row({ label, value, valueColor = colors.ink }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="caption" style={{ fontSize: 14 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: valueColor }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: GUTTER, marginBottom: 4 },
  line: { flexDirection: "row", gap: 14, paddingHorizontal: GUTTER, paddingVertical: 16, backgroundColor: colors.canvas, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  swipeAction: { width: 96, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", gap: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.brand, borderRadius: 3 },
  promoInput: { flex: 1, height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts.medium, letterSpacing: 1, color: colors.ink, backgroundColor: colors.surface },
  promoApplied: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(47,107,74,0.4)", backgroundColor: colors.successTint },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
