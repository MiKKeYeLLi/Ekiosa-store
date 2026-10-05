import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { getCategoryName } from "@ekiosa/shared/categories";
import { formatPrice } from "@ekiosa/shared/format";
import { POPULAR_SEARCHES } from "@ekiosa/shared/search-params";
import { ProductImage } from "@/components/product-image";
import { Text } from "@/components/ui/text";
import { useQuickSearch } from "@/lib/catalog";
import { colors, fonts, GUTTER, radius } from "@/theme";

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 200);
    return () => clearTimeout(t);
  }, [text]);
  const { data = [], isFetching } = useQuickSearch(q);

  const openShop = (term: string) => {
    router.back();
    router.navigate({ pathname: "/shop", params: { q: term } });
  };

  return (
    <View style={{ flex: 1, padding: GUTTER }}>
      <View style={styles.search}>
        <Feather name="search" size={17} color={colors.inkMuted} />
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder="Search products"
          placeholderTextColor={colors.inkMuted}
          returnKeyType="search"
          onSubmitEditing={() => text.trim() && openShop(text.trim())}
          accessibilityLabel="Search products"
          style={styles.input}
        />
        {text ? (
          <Pressable hitSlop={8} accessibilityLabel="Clear search" onPress={() => setText("")}>
            <Feather name="x" size={17} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {!q ? (
        <View style={{ marginTop: 24 }}>
          <Text variant="eyebrow" style={{ marginBottom: 12 }}>
            Popular searches
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_SEARCHES.map((term) => (
              <Pressable key={term} onPress={() => openShop(term)} style={styles.chip}>
                <Text style={{ fontSize: 14, color: colors.inkSoft }}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          style={{ marginTop: 16 }}
          ListEmptyComponent={
            <Text variant="caption" style={{ textAlign: "center", marginTop: 32 }}>
              {isFetching ? "Searching…" : `No matches for “${q}”.`}
            </Text>
          }
          ListFooterComponent={
            data.length ? (
              <Pressable onPress={() => openShop(q)} style={styles.all}>
                <Text style={{ fontFamily: fonts.medium, color: colors.ink }}>See all results for “{q}”</Text>
                <Feather name="arrow-right" size={16} color={colors.ink} />
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.back();
                router.push({ pathname: "/product/[slug]", params: { slug: item.slug } });
              }}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.subtle }]}
            >
              <ProductImage src={item.images[0]?.src} width={48} style={{ width: 48, height: 56, borderRadius: 8 }} />
              <View style={{ flex: 1 }}>
                <Text variant="label" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption">{getCategoryName(item.category)}</Text>
              </View>
              <Text variant="label">{formatPrice(item.price)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { height: 48, borderRadius: radius.full, backgroundColor: colors.subtle, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, height: "100%" },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.line, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 6, borderRadius: radius.md },
  all: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 6 },
});
