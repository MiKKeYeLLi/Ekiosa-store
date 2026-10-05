import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Link, router } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { unsplash } from "@ekiosa/shared/images";
import { ProductImage } from "@/components/product-image";
import { ProductRail } from "@/components/product-list";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/bits";
import { Text } from "@/components/ui/text";
import { useHome } from "@/lib/catalog";
import { colors, fonts, GUTTER, radius } from "@/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, isError, refetch, isRefetching } = useHome();

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/logo-wordmark.png")}
          accessibilityRole="image"
          accessibilityLabel="Ekiosa"
          contentFit="contain"
          style={{ width: 96, height: 42 }}
        />
        <Pressable accessibilityRole="search" accessibilityLabel="Search products" onPress={() => router.push("/search")} style={styles.searchPill}>
          <Feather name="search" size={16} color={colors.inkMuted} />
          <Text variant="caption">Search products</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={{ paddingHorizontal: GUTTER, marginTop: 12 }}>
        <View style={styles.hero}>
          <ProductImage src={unsplash("1586023492125-27b2c045efd7")} width={width} priority style={StyleSheet.absoluteFill} />
          <View style={styles.heroScrim} />
          <View style={{ padding: 22, gap: 10 }}>
            <Text variant="eyebrow" style={{ color: "rgba(255,255,255,0.85)" }}>
              The Autumn Edit · 2026
            </Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 42, lineHeight: 42, color: colors.white }}>
              Fewer, better <Text style={{ fontFamily: fonts.displayItalic, fontSize: 42, color: colors.white }}>things.</Text>
            </Text>
            <Button title="Shop the collection" variant="light" onPress={() => router.navigate("/shop")} style={{ alignSelf: "flex-start", marginTop: 6 }} />
          </View>
        </View>
      </View>

      {isError ? (
        <EmptyState
          icon="wifi-off"
          tone="danger"
          title="Couldn't load the store"
          description="Check your connection and try again."
          action={<Button title="Try again" onPress={() => refetch()} />}
        />
      ) : (
        <>
          {/* Categories */}
          <SectionTitle title="Shop by category" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: GUTTER }}>
            {(data?.categories ?? Array.from({ length: 4 })).map((c, i) =>
              c ? (
                <Link key={c.slug} href={{ pathname: "/shop", params: { category: c.slug } }} asChild>
                  <Pressable accessibilityLabel={c.name} style={{ width: 120 }}>
                    <ProductImage src={c.image} width={120} style={{ width: 120, height: 150, borderRadius: radius.lg }} />
                    <Text variant="label" style={{ marginTop: 8 }}>
                      {c.name}
                    </Text>
                    <Text variant="caption">{data?.counts[c.slug] ?? 0} items</Text>
                  </Pressable>
                </Link>
              ) : (
                <Skeleton key={i} style={{ width: 120, height: 150, borderRadius: radius.lg }} />
              ),
            )}
          </ScrollView>

          <SectionTitle title="Bestsellers" href={{ pathname: "/shop", params: { sort: "rating" } }} />
          {isLoading ? <RailSkeleton /> : <ProductRail products={data?.bestsellers ?? []} />}

          {/* Promo */}
          <View style={{ paddingHorizontal: GUTTER, marginTop: 36 }}>
            <View style={styles.promo}>
              <Text variant="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>
                Limited time
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.white, marginTop: 8 }}>
                The Autumn Sale — up to 25% off.
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 8, fontSize: 14.5, lineHeight: 21 }}>
                New customers take an extra 10% with code WELCOME10.
              </Text>
              <Button title="Shop the sale" variant="light" onPress={() => router.navigate({ pathname: "/shop", params: { sale: "1" } })} style={{ alignSelf: "flex-start", marginTop: 18 }} />
            </View>
          </View>

          <SectionTitle title="New arrivals" href={{ pathname: "/shop", params: { sort: "newest" } }} />
          {isLoading ? <RailSkeleton /> : <ProductRail products={data?.newArrivals ?? []} />}
        </>
      )}
    </ScrollView>
  );
}

function SectionTitle({ title, href }: { title: string; href?: Parameters<typeof router.navigate>[0] }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="title">{title}</Text>
      {href && (
        <Pressable hitSlop={8} onPress={() => router.navigate(href)}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.ink, textDecorationLine: "underline" }}>View all</Text>
        </Pressable>
      )}
    </View>
  );
}

function RailSkeleton() {
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: GUTTER }}>
      {[0, 1].map((i) => (
        <Skeleton key={i} style={{ width: 170, height: 212, borderRadius: radius.lg }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: GUTTER, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  searchPill: { flex: 1, maxWidth: 220, height: 40, borderRadius: radius.full, backgroundColor: colors.subtle, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  hero: { height: 380, borderRadius: radius.xl, overflow: "hidden", justifyContent: "flex-end", backgroundColor: colors.muted },
  heroScrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(20,20,18,0.28)" },
  sectionTitle: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: GUTTER, marginTop: 36, marginBottom: 16 },
  promo: { backgroundColor: colors.brand, borderRadius: radius.xl, padding: 24 },
});
