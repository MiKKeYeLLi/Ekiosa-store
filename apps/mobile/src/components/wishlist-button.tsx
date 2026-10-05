import { Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { Product } from "@ekiosa/shared/types";
import { useSession } from "@/lib/auth";
import { useToggleWishlist, useWishlist } from "@/lib/wishlist";
import { colors, shadow } from "@/theme";
import { useToast } from "./ui/toast";

export function WishlistButton({ product, floating = true }: { product: Product; floating?: boolean }) {
  const { user } = useSession();
  const { data: saved = [] } = useWishlist(user?.id);
  const toggle = useToggleWishlist(user?.id);
  const { toast } = useToast();
  const isSaved = saved.some((p) => p.id === product.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      accessibilityState={{ selected: isSaved }}
      hitSlop={6}
      onPress={() => {
        if (!user) {
          router.push({ pathname: "/sign-in", params: { reason: "wishlist" } });
          return;
        }
        Haptics.selectionAsync();
        toggle.mutate(
          { product, saved: isSaved },
          { onError: () => toast({ tone: "error", title: "Couldn't update your wishlist", description: "Please try again." }) },
        );
      }}
      style={({ pressed }) => [floating ? [styles.floating, shadow.card] : styles.inline, pressed && { transform: [{ scale: 0.92 }] }]}
    >
      <Feather name="heart" size={floating ? 17 : 22} color={isSaved ? colors.sale : colors.ink} style={isSaved ? styles.filled : undefined} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
  inline: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  // Feather has no filled heart; a heavier stroke + colour reads clearly as "saved".
  filled: { fontWeight: "900" },
});
