import { useEffect } from "react";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from "@expo-google-fonts/geist";
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { ToastProvider } from "@/components/ui/toast";
import "@/lib/push"; // installs the foreground notification handler
import { colors, fonts } from "@/theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

/** Open the screen a notification points at (e.g. ekiosa://order/<id>). */
function useNotificationRouting() {
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === "string" && url.startsWith("/")) router.push(url as never);
    };
    Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
  useNotificationRouting();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.canvas },
                headerTitleStyle: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
                headerTintColor: colors.ink,
                headerBackButtonDisplayMode: "minimal",
                contentStyle: { backgroundColor: colors.canvas },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="product/[slug]" options={{ title: "", headerTransparent: true }} />
              <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
              <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
              <Stack.Screen name="sign-in" options={{ presentation: "modal", title: "" }} />
              <Stack.Screen name="search" options={{ presentation: "modal", title: "Search" }} />
            </Stack>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
