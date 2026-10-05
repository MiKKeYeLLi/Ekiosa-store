import { ScrollView, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COUNTRIES } from "@ekiosa/shared/checkout-validation";
import { formatDate, formatPrice } from "@ekiosa/shared/format";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Divider, EmptyState, Skeleton } from "@/components/ui/bits";
import { Text } from "@/components/ui/text";
import { useOrder } from "@/lib/orders";
import { colors, fonts, GUTTER, radius } from "@/theme";

const STEPS = ["confirmed", "shipped", "delivered"] as const;

export default function OrderScreen() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const insets = useSafeAreaInsets();
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const justPlaced = placed === "1";

  if (isLoading) {
    return (
      <View style={{ padding: GUTTER, gap: 14 }}>
        <Skeleton style={{ width: 56, height: 56, borderRadius: 28 }} />
        <Skeleton style={{ width: "70%", height: 34 }} />
        <Skeleton style={{ height: 120, borderRadius: radius.lg }} />
        <Skeleton style={{ height: 200, borderRadius: radius.lg }} />
      </View>
    );
  }
  if (isError) return <EmptyState icon="alert-triangle" tone="danger" title="Couldn't load this order" action={<Button title="Try again" onPress={() => refetch()} />} />;
  if (!order) {
    return (
      <EmptyState
        icon="file-text"
        title="Order not found"
        description="Make sure you're signed in with the Google account you used to place it."
        action={<Button title="View my orders" onPress={() => router.navigate("/account")} />}
      />
    );
  }

  const a = order.shippingAddress;
  const country = COUNTRIES.find((c) => c.value === a.country)?.label ?? a.country;
  const sameDay = order.estimatedDelivery.from.slice(0, 10) === order.estimatedDelivery.to.slice(0, 10);
  const stepIndex = Math.max(0, STEPS.indexOf(order.status as (typeof STEPS)[number]));

  return (
    <>
      <Stack.Screen options={{ title: order.number, headerBackVisible: !justPlaced, gestureEnabled: !justPlaced }} />
      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: insets.bottom + 32, gap: 18 }}>
        {justPlaced && (
          <View style={{ gap: 10 }}>
            <View style={styles.check}>
              <Feather name="check" size={28} color={colors.white} />
            </View>
            <Text style={{ fontFamily: fonts.medium, color: colors.success, fontSize: 14 }}>Order confirmed</Text>
            <Text variant="display" style={{ fontSize: 38 }}>
              Thank you, {a.firstName}.
            </Text>
            <Text variant="body" style={{ color: colors.inkMuted }}>
              A confirmation is on its way to <Text style={{ fontFamily: fonts.medium, color: colors.ink }}>{order.contact.email}</Text>.
            </Text>
          </View>
        )}

        <View style={styles.delivery}>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            {order.status === "delivered" ? "Delivered" : order.status === "cancelled" ? "Cancelled" : "Estimated delivery"}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.white, marginTop: 4 }}>
            {sameDay
              ? formatDate(order.estimatedDelivery.from, { weekday: "long", month: "long", day: "numeric" })
              : `${formatDate(order.estimatedDelivery.from)} – ${formatDate(order.estimatedDelivery.to)}`}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 18 }}>
            {STEPS.map((s, i) => (
              <View key={s} style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= stepIndex ? colors.white : "rgba(255,255,255,0.25)" }} />
                <Text style={{ fontSize: 12, color: i <= stepIndex ? colors.white : "rgba(255,255,255,0.6)", fontFamily: i <= stepIndex ? fonts.medium : fonts.regular }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={{ marginBottom: 12 }}>
            Items
          </Text>
          {order.lines.map((l) => (
            <View key={l.productId} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <ProductImage src={l.image} width={48} style={{ width: 48, height: 60, borderRadius: 8 }} />
              <View style={{ flex: 1 }}>
                <Text variant="label" numberOfLines={2}>
                  {l.name}
                </Text>
                <Text variant="caption">
                  {l.quantity} × {formatPrice(l.unitPrice)}
                </Text>
              </View>
              <Text variant="label">{formatPrice(l.unitPrice * l.quantity)}</Text>
            </View>
          ))}
          <Divider style={{ marginVertical: 8 }} />
          <Row label="Subtotal" value={formatPrice(order.totals.subtotal)} />
          {order.totals.discount > 0 && <Row label={`Discount${order.promo ? ` (${order.promo.code})` : ""}`} value={`−${formatPrice(order.totals.discount)}`} />}
          <Row label={`Shipping · ${order.shippingMethod.name}`} value={order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)} />
          <Row label="Tax" value={formatPrice(order.totals.tax)} />
          <Row label="Total" value={formatPrice(order.totals.total)} strong />
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={{ marginBottom: 8 }}>
            Shipping to
          </Text>
          <Text variant="body" style={{ color: colors.inkMuted }}>
            {a.firstName} {a.lastName}
            {"\n"}
            {a.address1}
            {a.address2 ? `\n${a.address2}` : ""}
            {"\n"}
            {a.city}, {a.region} {a.postalCode}
            {"\n"}
            {country}
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="heading" style={{ marginBottom: 8 }}>
            Payment
          </Text>
          <Text variant="body" style={{ color: colors.inkMuted }}>
            Demo payment — no charge made{"\n"}Placed {formatDate(order.createdAt, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>

        <Button title="Continue shopping" size="lg" onPress={() => router.dismissTo("/shop")} />
      </ScrollView>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: strong ? 6 : 0 }}>
      <Text style={{ fontSize: strong ? 16 : 14, fontFamily: strong ? fonts.semibold : fonts.regular, color: strong ? colors.ink : colors.inkMuted }}>{label}</Text>
      <Text style={{ fontSize: strong ? 16 : 14, fontFamily: strong ? fonts.semibold : fonts.regular, color: colors.ink }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  check: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  delivery: { backgroundColor: colors.brand, borderRadius: radius.xl, padding: 20 },
  card: { padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
});
