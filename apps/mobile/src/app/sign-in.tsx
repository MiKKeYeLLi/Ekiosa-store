import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { signInWithGoogle } from "@/lib/auth";
import { colors, GUTTER, radius } from "@/theme";

const copy: Record<string, { title: string; body: string }> = {
  checkout: { title: "Sign in to check out", body: "We use your Google account to keep your orders secure and send your confirmation. Your bag is saved." },
  wishlist: { title: "Save your favourites", body: "Sign in to keep a wishlist that syncs across your devices." },
  default: { title: "Welcome to Ekiosa", body: "Sign in to track orders, save favourites and check out faster." },
};

export default function SignInScreen() {
  const { next, reason } = useLocalSearchParams<{ next?: string; reason?: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const c = copy[next === "/checkout" ? "checkout" : (reason ?? "default")] ?? copy.default;

  async function onPress() {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    if (result.ok) {
      if (next && next.startsWith("/")) router.replace(next as never);
      else router.back();
      return;
    }
    if (!result.cancelled) toast({ tone: "error", title: "Couldn't sign in", description: result.message });
  }

  return (
    <View style={{ flex: 1, padding: GUTTER, paddingTop: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandTint, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Feather name="user" size={24} color={colors.brand} />
      </View>
      <Text variant="display" style={{ fontSize: 36 }}>
        {c.title}
      </Text>
      <Text variant="body" style={{ marginTop: 10, color: colors.inkMuted }}>
        {c.body}
      </Text>

      <View style={{ marginTop: 28, padding: 20, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, gap: 14 }}>
        <Button title="Continue with Google" size="lg" loading={loading} onPress={onPress} icon={<Feather name="log-in" size={17} color={colors.white} />} />
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Feather name="lock" size={12} color={colors.inkMuted} />
          <Text variant="caption">We only receive your name, email and profile photo.</Text>
        </View>
      </View>
    </View>
  );
}
