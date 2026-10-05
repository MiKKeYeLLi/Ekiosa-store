import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { categories } from "@ekiosa/shared/categories";
import { PRICE_PRESETS, SORT_OPTIONS, countActiveFilters, parseProductQuery } from "@ekiosa/shared/search-params";
import type { CategorySlug, ProductQuery, SortOption } from "@ekiosa/shared/types";
import { pluralize } from "@ekiosa/shared/format";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/bits";
import { Checkbox } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { useFacetCounts, useProducts } from "@/lib/catalog";
import { colors, fonts, GUTTER, radius } from "@/theme";

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; sort?: string; sale?: string; q?: string }>();

  // Route params (from Home links) seed the filters; afterwards the screen owns them.
  // useLocalSearchParams returns a new object every render, so compare by content
  // (a stable string key) — comparing objects caused an infinite re-render loop.
  const paramsKey = new URLSearchParams(
    Object.entries(params).filter(([, v]) => typeof v === "string") as [string, string][],
  ).toString();
  const initial = useMemo(() => parseProductQuery(new URLSearchParams(paramsKey)), [paramsKey]);
  const [query, setQuery] = useState<ProductQuery>(initial);
  const [text, setText] = useState(initial.q ?? "");
  const [prevKey, setPrevKey] = useState(paramsKey);
  if (prevKey !== paramsKey) {
    setPrevKey(paramsKey);
    setQuery(initial);
    setText(initial.q ?? "");
  }

  useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, q: text.trim() || undefined })), 300);
    return () => clearTimeout(t);
  }, [text]);

  const [sheet, setSheet] = useState<"filters" | "sort" | null>(null);
  const products = useProducts(query);
  const facets = useFacetCounts(query);
  const active = countActiveFilters(query);

  const toggleCategory = (slug: CategorySlug) =>
    setQuery((q) => {
      const cur = q.categories ?? [];
      return { ...q, categories: cur.includes(slug) ? cur.filter((c) => c !== slug) : [...cur, slug] };
    });

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 16, gap: 14 }}>
      <View style={{ paddingHorizontal: GUTTER }}>
        <Text variant="display" style={{ fontSize: 36 }}>
          Shop
        </Text>
      </View>
      <View style={[styles.search, { marginHorizontal: GUTTER }]}>
        <Feather name="search" size={17} color={colors.inkMuted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search products"
          placeholderTextColor={colors.inkMuted}
          returnKeyType="search"
          accessibilityLabel="Search products"
          style={styles.searchInput}
        />
        {text ? (
          <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setText("")}>
            <Feather name="x" size={17} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
        {categories.map((c) => {
          const on = query.categories?.includes(c.slug);
          return (
            <Pressable key={c.slug} accessibilityState={{ selected: on }} onPress={() => toggleCategory(c.slug)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={{ fontSize: 13.5, fontFamily: fonts.medium, color: on ? colors.white : colors.inkSoft }}>{c.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.toolbar}>
        <Pressable onPress={() => setSheet("filters")} style={styles.toolBtn} accessibilityRole="button">
          <Feather name="sliders" size={15} color={colors.ink} />
          <Text variant="label">Filters</Text>
          {active > 0 && (
            <View style={styles.count}>
              <Text style={{ color: colors.white, fontSize: 11, fontFamily: fonts.semibold }}>{active}</Text>
            </View>
          )}
        </Pressable>
        <Text variant="caption">{products.data ? pluralize(products.data.length, "product") : products.isFetching ? "Loading…" : ""}</Text>
        <Pressable onPress={() => setSheet("sort")} style={styles.toolBtn} accessibilityRole="button">
          <Feather name="bar-chart-2" size={15} color={colors.ink} />
          <Text variant="label">{SORT_OPTIONS.find((o) => o.value === (query.sort ?? "featured"))?.label}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {products.isError ? (
        <>
          {header}
          <EmptyState icon="alert-triangle" tone="danger" title="Couldn't load products" description="Check your connection and try again." action={<Button title="Try again" onPress={() => products.refetch()} />} />
        </>
      ) : products.isLoading ? (
        <>
          {header}
          <ProductGridSkeleton />
        </>
      ) : (
        <ProductGrid
          products={products.data ?? []}
          header={header}
          refreshing={products.isRefetching}
          onRefresh={() => products.refetch()}
          empty={
            <EmptyState
              icon="search"
              title="No products found"
              description={query.q ? `Nothing matches “${query.q}”. Try another search or remove a filter.` : "No products match these filters."}
              action={
                <Button
                  title="Clear all filters"
                  variant="outline"
                  onPress={() => {
                    setText("");
                    setQuery({ sort: query.sort });
                  }}
                />
              }
            />
          }
        />
      )}

      {/* Sort sheet */}
      <Sheet visible={sheet === "sort"} title="Sort by" onClose={() => setSheet(null)}>
        {SORT_OPTIONS.map((o) => {
          const on = (query.sort ?? "featured") === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                setQuery((q) => ({ ...q, sort: o.value as SortOption }));
                setSheet(null);
              }}
              style={styles.sortRow}
            >
              <Text variant="label" style={{ fontSize: 15.5 }}>
                {o.label}
              </Text>
              {on && <Feather name="check" size={18} color={colors.brand} />}
            </Pressable>
          );
        })}
      </Sheet>

      {/* Filter sheet */}
      <Sheet
        visible={sheet === "filters"}
        title={`Filters${active ? ` (${active})` : ""}`}
        onClose={() => setSheet(null)}
        footer={
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button title="Clear" variant="outline" style={{ flex: 1 }} disabled={!active} onPress={() => setQuery({ q: query.q, sort: query.sort })} />
            <Button title={products.data ? `Show ${pluralize(products.data.length, "result")}` : "Show results"} style={{ flex: 2 }} loading={products.isFetching} onPress={() => setSheet(null)} />
          </View>
        }
      >
        <Text variant="heading" style={styles.sheetSection}>
          Category
        </Text>
        <View style={{ gap: 14 }}>
          {categories.map((c) => (
            <View key={c.slug} style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Checkbox label={c.name} checked={!!query.categories?.includes(c.slug)} onChange={() => toggleCategory(c.slug)} />
              </View>
              <Text variant="caption">{facets.data?.[c.slug] ?? 0}</Text>
            </View>
          ))}
        </View>

        <Text variant="heading" style={styles.sheetSection}>
          Price
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PRICE_PRESETS.map((p) => {
            const min = p.min != null ? p.min * 100 : undefined;
            const max = p.max != null ? p.max * 100 : undefined;
            const on = query.minPrice === min && query.maxPrice === max;
            return (
              <Pressable
                key={p.label}
                accessibilityState={{ selected: on }}
                onPress={() => setQuery((q) => (on ? { ...q, minPrice: undefined, maxPrice: undefined } : { ...q, minPrice: min, maxPrice: max }))}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={{ fontSize: 13.5, fontFamily: fonts.medium, color: on ? colors.white : colors.inkSoft }}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="heading" style={styles.sheetSection}>
          Availability
        </Text>
        <View style={{ gap: 14, paddingBottom: 8 }}>
          <Checkbox label="In stock only" checked={!!query.inStockOnly} onChange={(v) => setQuery((q) => ({ ...q, inStockOnly: v }))} />
          <Checkbox label="On sale" checked={!!query.onSaleOnly} onChange={(v) => setQuery((q) => ({ ...q, onSaleOnly: v }))} />
        </View>
      </Sheet>
    </View>
  );
}

/** Bottom sheet built on Modal. */
function Sheet({ visible, title, onClose, children, footer }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <Text variant="heading">{title}</Text>
          <Pressable accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
            <Feather name="x" size={22} color={colors.inkMuted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>{children}</ScrollView>
        {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  search: { height: 46, borderRadius: radius.full, backgroundColor: colors.subtle, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: colors.ink, height: "100%" },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, justifyContent: "center", backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER },
  toolBtn: { flexDirection: "row", alignItems: "center", gap: 7, height: 38, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  count: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(27,26,23,0.4)" },
  sheet: { maxHeight: "85%", backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, marginTop: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  sheetSection: { marginTop: 18, marginBottom: 12 },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
});
