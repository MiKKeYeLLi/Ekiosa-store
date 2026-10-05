import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { selectItemCount, useCart } from "@/lib/cart-store";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Feather.glyphMap;
const icon = (name: IconName) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Feather name={name} size={22} color={color} />;
  };

export default function TabsLayout() {
  const count = useCart(selectItemCount);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="shop" options={{ title: "Shop", tabBarIcon: icon("grid") }} />
      <Tabs.Screen name="wishlist" options={{ title: "Saved", tabBarIcon: icon("heart") }} />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Bag",
          tabBarIcon: icon("shopping-bag"),
          tabBarBadge: count > 0 ? (count > 99 ? "99+" : count) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.ink, color: colors.white, fontFamily: fonts.semibold, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: icon("user") }} />
    </Tabs>
  );
}
