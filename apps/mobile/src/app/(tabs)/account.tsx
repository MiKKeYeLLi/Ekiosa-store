import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Link, router } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { formatDate, formatPrice, pluralize } from "@ekiosa/shared/format";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Skeleton } from "@/components/ui/bits";
import { Text } from "@/components/ui/text";
import { signOut, useSession } from "@/lib/auth";
import { useMyOrders } from "@/lib/orders";
import { unregisterPushToken } from "@/lib/push";
import { colors, fonts, GUTTER, radius } from "@/theme";

const statusTone = { confirmed: "success", shipped: "brand", delivered: "neutral", cancelled: "warning" } as const;

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user, ready } = useSession();
  const orders = useMyOrders(!!user);

  if (!ready) return null;

  if (!user) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40 }}>
        <EmptyState
          icon="user"
          title="Your account"
          description="Sign in with Google to track orders, save favourites and check out faster."
          action={<Button title="Sign in with Google" onPress={() => router.push("/sign-in")} />}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 48, paddingHorizontal: GUTTER }}
      refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => orders.refetch()} tintColor={colors.brand} />}
    >
      <View style={styles.profile}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: colors.white, fontFamily: fonts.medium, fontSize: 22 }}>{(user.fullName ?? user.email).charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text variant="title">{user.fullName ? `Hi, ${user.fullName.split(" ")[0]}` : "Your account"}</Text>
          <Text variant="caption" numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>

      <Text variant="heading" style={{ marginTop: 28, marginBottom: 12 }}>
        Your orders
      </Text>
      {orders.isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} style={{ height: 76, borderRadius: radius.lg }} />
          ))}
        </View>
      ) : orders.isError ? (
        <EmptyState icon="alert-triangle" tone="danger" title="Couldn't load orders" action={<Button title="Try again" onPress={() => orders.refetch()} />} />
      ) : !orders.data?.length ? (
        <View style={styles.card}>
          <Text variant="body">No orders yet. When you place one, it will appear here.</Text>
          <Button title="Start shopping" variant="outline" size="sm" onPress={() => router.navigate("/shop")} style={{ alignSelf: "flex-start", marginTop: 12 }} />
        </View>
      ) : (
        <View style={styles.list}>
          {orders.data.map((o, i) => (
            <Link key={o.id} href={{ pathname: "/order/[id]", params: { id: o.id } }} asChild>
              <Pressable style={({ pressed }) => [styles.orderRow, i > 0 && styles.rowBorder, pressed && { backgroundColor: colors.subtle }]}>
                <View style={{ flexDirection: "row" }}>
                  {o.lines.slice(0, 2).map((l, j) => (
                    <ProductImage key={l.productId} src={l.image} width={44} style={[styles.thumb, j > 0 && { marginLeft: -12 }]} />
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.ink }}>{o.number}</Text>
                  <Text variant="caption">
                    {formatDate(o.createdAt, { month: "short", day: "numeric", year: "numeric" })} · {pluralize(o.lines.reduce((n, l) => n + l.quantity, 0), "item")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text variant="label">{formatPrice(o.totals.total)}</Text>
                  <Badge tone={statusTone[o.status as keyof typeof statusTone] ?? "neutral"}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</Badge>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      <Button
        title="Sign out"
        variant="outline"
        icon={<Feather name="log-out" size={16} color={colors.ink} />}
        style={{ marginTop: 32 }}
        onPress={async () => {
          await unregisterPushToken();
          await signOut();
          qc.clear();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  card: { padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  list: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: "hidden" },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  thumb: { width: 40, height: 50, borderRadius: 8, borderWidth: 2, borderColor: colors.surface },
});
