import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { getCategoryName } from "@ekiosa/shared/categories";
import { FREE_SHIPPING_THRESHOLD } from "@ekiosa/shared/pricing";
import { formatPrice } from "@ekiosa/shared/format";
import { ProductImage } from "@/components/product-image";
import { ProductRail } from "@/components/product-list";
import { Button } from "@/components/ui/button";
import { Badge, Divider, EmptyState, Price, Rating, Skeleton, StockStatus } from "@/components/ui/bits";
import { QuantitySelector } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { WishlistButton } from "@/components/wishlist-button";
import { useProduct, useRelated } from "@/lib/catalog";
import { useAddToBag } from "@/lib/use-add-to-bag";
import { colors, fonts, GUTTER, radius, shadow } from "@/theme";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: product, isLoading, isError, refetch } = useProduct(slug);
  const related = useRelated(product);
  const { addToBag, remaining, inBag, justAdded, soldOut } = useAddToBag(product);
  const [qty, setQty] = useState(1);
  const [slide, setSlide] = useState(0);
  const [open, setOpen] = useState<string | null>("Description");

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Skeleton style={{ width, height: width * 1.15, borderRadius: 0 }} />
        <View style={{ padding: GUTTER, gap: 12 }}>
          <Skeleton style={{ width: 90, height: 12 }} />
          <Skeleton style={{ width: "80%", height: 28 }} />
          <Skeleton style={{ width: 120, height: 22 }} />
        </View>
      </View>
    );
  }
  if (isError || !product) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40 }}>
        <Stack.Screen options={{ headerTransparent: false, title: "" }} />
        {isError ? (
          <EmptyState icon="alert-triangle" tone="danger" title="Couldn't load this product" action={<Button title="Try again" onPress={() => refetch()} />} />
        ) : (
          <EmptyState icon="package" title="Product not found" description="It may have been discontinued." action={<Button title="Browse products" onPress={() => router.navigate("/shop")} />} />
        )}
      </View>
    );
  }

  const max = Math.max(1, remaining);
  const quantity = Math.min(qty, max);
  const sections = [
    { title: "Description", body: product.description, list: product.highlights },
    {
      title: "Product details",
      rows: [{ label: "Category", value: getCategoryName(product.category) }, ...product.details, { label: "SKU", value: product.id.toUpperCase() }],
    },
    {
      title: "Shipping & returns",
      body: `Standard delivery is free on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)} and arrives in 4–6 business days. Express and next-day options are available at checkout. Free returns within 30 days.`,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <View>
          <FlatList
            data={product.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(img) => img.src}
            onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <ProductImage src={item.src} alt={item.alt} width={width} priority={index === 0} style={{ width, height: width * 1.15 }} />
            )}
          />
          {product.images.length > 1 && (
            <View style={styles.dots} pointerEvents="none">
              {product.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === slide && styles.dotOn]} />
              ))}
            </View>
          )}
        </View>

        <View style={{ padding: GUTTER, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text variant="eyebrow">{product.brand}</Text>
            {product.tags.includes("new") && <Badge tone="brand">New</Badge>}
            {product.tags.includes("bestseller") && <Badge>Bestseller</Badge>}
          </View>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <Text variant="title" style={{ flex: 1, fontSize: 32, lineHeight: 35 }}>
              {product.name}
            </Text>
            <WishlistButton product={product} floating={false} />
          </View>
          <Rating value={product.rating} count={product.reviewCount} />
          <View style={{ marginTop: 6 }}>
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" showDiscount />
          </View>
          <Text variant="caption">
            Taxes calculated at checkout. {product.price >= FREE_SHIPPING_THRESHOLD ? "Ships free." : `Free shipping over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`}
          </Text>
          <Text variant="body" style={{ marginTop: 6 }}>
            {product.shortDescription}
          </Text>
          <View style={{ marginTop: 8 }}>
            <StockStatus stock={product.stock} />
          </View>
          {!soldOut && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <Text variant="label">Quantity</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {inBag > 0 && <Text variant="caption">{inBag} in bag</Text>}
                <QuantitySelector value={quantity} max={max} onChange={setQty} />
              </View>
            </View>
          )}

          <View style={styles.perks}>
            {[
              ["truck", "Delivery in 4–6 business days, or next day with express"],
              ["rotate-ccw", "Free returns within 30 days"],
              ["shield", "Covered by our 2-year warranty"],
            ].map(([icon, text]) => (
              <View key={text} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Feather name={icon as "truck"} size={16} color={colors.ink} />
                <Text variant="caption" style={{ flex: 1, color: colors.inkSoft }}>
                  {text}
                </Text>
              </View>
            ))}
          </View>

          {/* Accordion */}
          <View style={{ marginTop: 8 }}>
            {sections.map((s) => {
              const expanded = open === s.title;
              return (
                <View key={s.title}>
                  <Divider />
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpen(expanded ? null : s.title)} style={styles.accHead}>
                    <Text variant="label" style={{ fontSize: 15.5 }}>
                      {s.title}
                    </Text>
                    <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.inkMuted} />
                  </Pressable>
                  {expanded && (
                    <View style={{ paddingBottom: 18, gap: 8 }}>
                      {s.body ? <Text variant="body" style={{ color: colors.inkMuted }}>{s.body}</Text> : null}
                      {s.list?.map((h) => (
                        <View key={h} style={{ flexDirection: "row", gap: 8 }}>
                          <Feather name="check" size={15} color={colors.brand} style={{ marginTop: 3 }} />
                          <Text variant="body" style={{ flex: 1 }}>
                            {h}
                          </Text>
                        </View>
                      ))}
                      {s.rows?.map((r) => (
                        <View key={r.label} style={{ flexDirection: "row", gap: 12 }}>
                          <Text variant="caption" style={{ width: 110 }}>
                            {r.label}
                          </Text>
                          <Text variant="caption" style={{ flex: 1, color: colors.inkSoft }}>
                            {r.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <Divider />
          </View>
        </View>

        {(related.data?.length ?? 0) > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text variant="title" style={{ paddingHorizontal: GUTTER, marginBottom: 16 }}>
              You may also like
            </Text>
            <ProductRail products={related.data ?? []} />
          </View>
        )}
      </ScrollView>

      {/* Sticky purchase bar */}
      <View style={[styles.bar, shadow.pop, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 17, color: colors.ink }}>{formatPrice(product.price * quantity)}</Text>
        </View>
        <Button
          title={soldOut ? "Sold out" : remaining <= 0 ? "All in your bag" : justAdded ? "Added" : "Add to bag"}
          variant={justAdded ? "success" : "primary"}
          size="lg"
          icon={<Feather name={justAdded ? "check" : "shopping-bag"} size={17} color={colors.white} />}
          disabled={soldOut || remaining <= 0}
          onPress={() => addToBag(quantity)}
          style={{ minWidth: 170 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { position: "absolute", bottom: 14, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotOn: { width: 18, backgroundColor: colors.white },
  perks: { marginTop: 16, gap: 12, backgroundColor: colors.subtle, borderRadius: radius.lg, padding: 16 },
  accHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
