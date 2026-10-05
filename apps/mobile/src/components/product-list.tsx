import type { ReactElement } from "react";
import { FlatList, RefreshControl, ScrollView, View, useWindowDimensions } from "react-native";
import type { Product } from "@ekiosa/shared/types";
import { colors, GUTTER } from "@/theme";
import { ProductCard } from "./product-card";
import { Skeleton } from "./ui/bits";

const GAP = 12;

export function useGridWidth(columns = 2) {
  const { width } = useWindowDimensions();
  const cols = width >= 700 ? 3 : columns;
  return { cols, cardWidth: (width - GUTTER * 2 - GAP * (cols - 1)) / cols };
}

/** Two-column (three on tablets) product grid with pull-to-refresh. */
export function ProductGrid({
  products,
  header,
  empty,
  refreshing,
  onRefresh,
}: {
  products: Product[];
  header?: ReactElement;
  empty?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { cols, cardWidth } = useGridWidth();
  return (
    <FlatList
      key={cols}
      data={products}
      keyExtractor={(p) => p.id}
      numColumns={cols}
      renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: GUTTER }}
      contentContainerStyle={{ gap: 28, paddingBottom: 40 }}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      keyboardDismissMode="on-drag"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}
      initialNumToRender={6}
      windowSize={7}
    />
  );
}

/** Horizontal product rail for the home screen. */
export function ProductRail({ products }: { products: Product[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(200, width * 0.44);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: GAP, paddingHorizontal: GUTTER }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} width={cardWidth} />
      ))}
    </ScrollView>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const { cols, cardWidth } = useGridWidth();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingHorizontal: GUTTER }} accessibilityLabel="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: cardWidth, gap: 8, marginBottom: 16 }}>
          <Skeleton style={{ width: cardWidth, height: cardWidth * 1.25, borderRadius: 16 }} />
          <Skeleton style={{ width: "40%", height: 10 }} />
          <Skeleton style={{ width: "85%", height: 14 }} />
          <Skeleton style={{ width: "30%", height: 14 }} />
        </View>
      )).slice(0, Math.max(cols, count))}
    </View>
  );
}
