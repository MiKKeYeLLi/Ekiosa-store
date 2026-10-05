import { View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pluralize } from "@ekiosa/shared/format";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/bits";
import { Text } from "@/components/ui/text";
import { useSession } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { GUTTER } from "@/theme";

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { user, ready } = useSession();
  const wishlist = useWishlist(user?.id);

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: GUTTER, paddingBottom: 16 }}>
      <Text variant="display" style={{ fontSize: 36 }}>
        Saved
      </Text>
      {wishlist.data?.length ? <Text variant="caption">{pluralize(wishlist.data.length, "item")}</Text> : null}
    </View>
  );

  if (!ready) return null;

  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <EmptyState
          icon="heart"
          title="Save your favourites"
          description="Sign in to keep a wishlist that syncs across your devices."
          action={<Button title="Sign in with Google" onPress={() => router.push({ pathname: "/sign-in", params: { reason: "wishlist" } })} />}
        />
      </View>
    );
  }

  if (wishlist.isLoading) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <ProductGridSkeleton count={4} />
      </View>
    );
  }

  return (
    <ProductGrid
      products={wishlist.data ?? []}
      header={header}
      refreshing={wishlist.isRefetching}
      onRefresh={() => wishlist.refetch()}
      empty={
        wishlist.isError ? (
          <EmptyState icon="alert-triangle" tone="danger" title="Couldn't load your wishlist" action={<Button title="Try again" onPress={() => wishlist.refetch()} />} />
        ) : (
          <EmptyState
            icon="heart"
            title="Nothing saved yet"
            description="Tap the heart on any product to save it here."
            action={<Button title="Browse products" onPress={() => router.navigate("/shop")} />}
          />
        )
      }
    />
  );
}
