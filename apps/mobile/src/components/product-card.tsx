import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { getCategoryName } from "@ekiosa/shared/categories";
import { discountPercent } from "@ekiosa/shared/format";
import type { Product } from "@ekiosa/shared/types";
import { useAddToBag } from "@/lib/use-add-to-bag";
import { colors, radius, shadow } from "@/theme";
import { ProductImage } from "./product-image";
import { Badge, Price, Rating, StockStatus } from "./ui/bits";
import { Text } from "./ui/text";
import { WishlistButton } from "./wishlist-button";

export const ProductCard = memo(function ProductCard({ product, width }: { product: Product; width: number }) {
  const pct = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const { addToBag, remaining } = useAddToBag(product);

  return (
    <View style={{ width }}>
      <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} asChild>
        <Pressable accessibilityLabel={product.name} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <View>
            <ProductImage
              src={product.images[0]?.src}
              alt={product.images[0]?.alt}
              width={width}
              style={[styles.image, { width, height: width * 1.25 }, soldOut && { opacity: 0.7 }]}
            />
            <View style={styles.badges} pointerEvents="none">
              {soldOut ? (
                <Badge tone="inverse">Sold out</Badge>
              ) : pct > 0 ? (
                <Badge tone="sale">{`−${pct}%`}</Badge>
              ) : product.tags.includes("new") ? (
                <Badge tone="light">New</Badge>
              ) : product.tags.includes("bestseller") ? (
                <Badge tone="light">Bestseller</Badge>
              ) : null}
            </View>
          </View>
          <View style={styles.meta}>
            <Text variant="eyebrow">{getCategoryName(product.category)}</Text>
            <Text variant="label" numberOfLines={2} style={{ fontSize: 14.5, lineHeight: 19 }}>
              {product.name}
            </Text>
            <Rating value={product.rating} count={product.reviewCount} />
            <Price price={product.price} compareAtPrice={product.compareAtPrice} />
            <StockStatus stock={product.stock} hideInStock />
          </View>
        </Pressable>
      </Link>

      <View style={styles.wish}>
        <WishlistButton product={product} />
      </View>
      {!soldOut && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to bag`}
          disabled={remaining <= 0}
          onPress={() => addToBag(1)}
          style={({ pressed }) => [styles.quickAdd, shadow.card, { top: width * 1.25 - 46 }, pressed && { transform: [{ scale: 0.92 }] }, remaining <= 0 && { opacity: 0.5 }]}
        >
          <Feather name="plus" size={18} color={colors.ink} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  image: { borderRadius: radius.lg },
  badges: { position: "absolute", top: 10, left: 10 },
  wish: { position: "absolute", top: 8, right: 8 },
  quickAdd: { position: "absolute", right: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.96)", alignItems: "center", justifyContent: "center" },
  meta: { gap: 4, paddingTop: 10 },
});
