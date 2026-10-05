/** Small presentational pieces: Badge, Price, Rating, StockStatus, Skeleton, EmptyState, Divider. */
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { discountPercent, formatPrice, getStockStatus } from "@ekiosa/shared/format";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./text";

type Tone = "neutral" | "sale" | "success" | "warning" | "brand" | "inverse" | "light";
const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.subtle, fg: colors.inkSoft },
  sale: { bg: colors.sale, fg: colors.white },
  success: { bg: colors.successTint, fg: colors.success },
  warning: { bg: colors.warningTint, fg: colors.warning },
  brand: { bg: colors.brandTint, fg: colors.brand },
  inverse: { bg: colors.ink, fg: colors.white },
  light: { bg: colors.white, fg: colors.ink },
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: tones[tone].bg }]}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: tones[tone].fg }}>{children}</Text>
    </View>
  );
}

export function Price({ price, compareAtPrice, size = "sm", showDiscount }: { price: number; compareAtPrice?: number; size?: "sm" | "lg"; showDiscount?: boolean }) {
  const pct = discountPercent(price, compareAtPrice);
  return (
    <View style={styles.row}>
      <Text style={{ fontFamily: fonts.medium, fontSize: size === "lg" ? 24 : 15, color: pct ? colors.sale : colors.ink }}>{formatPrice(price)}</Text>
      {pct > 0 && compareAtPrice ? (
        <>
          <Text style={{ fontSize: size === "lg" ? 16 : 13, color: colors.inkFaint, textDecorationLine: "line-through" }}>{formatPrice(compareAtPrice)}</Text>
          {showDiscount && <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.sale }}>Save {pct}%</Text>}
        </>
      ) : null}
    </View>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`Rated ${value.toFixed(1)} out of 5`}>
      <Feather name="star" size={12} color={colors.ink} />
      <Text variant="caption" style={{ fontSize: 12 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.inkSoft }}>{value.toFixed(1)}</Text>
        {count != null ? ` (${count.toLocaleString("en-US")})` : ""}
      </Text>
    </View>
  );
}

export function StockStatus({ stock, hideInStock }: { stock: number; hideInStock?: boolean }) {
  const status = getStockStatus(stock);
  if (hideInStock && status === "in_stock") return null;
  const c = { in_stock: [colors.success, "In stock"], low_stock: [colors.warning, `Only ${stock} left`], out_of_stock: [colors.inkMuted, "Out of stock"] }[status];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: c[0] }]} />
      <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: c[0] }}>{c[1]}</Text>
    </View>
  );
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: colors.muted, borderRadius: radius.sm, opacity }, style]} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, tone === "danger" && { backgroundColor: colors.dangerTint }]}>
        <Feather name={icon} size={26} color={tone === "danger" ? colors.danger : colors.inkMuted} />
      </View>
      <Text variant="title" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" style={{ textAlign: "center", color: colors.inkMuted, marginTop: 8, maxWidth: 320 }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 24, gap: 10, alignSelf: "stretch", alignItems: "center" }}>{action}</View> : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />;
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", height: 22, paddingHorizontal: 9, borderRadius: radius.full, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 56 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.subtle, alignItems: "center", justifyContent: "center", marginBottom: 20 },
});
