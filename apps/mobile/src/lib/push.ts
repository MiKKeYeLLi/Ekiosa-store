import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Show notifications even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Ask for permission (call after a meaningful moment, e.g. the first order —
 * not at launch), then register this device's Expo push token for the user.
 * Returns false if unavailable or declined; never throws.
 */
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    if (!Device.isDevice) return false; // emulators can't receive push

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1F3D33",
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return false;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn("[push] No EAS projectId — run `eas init` so push tokens can be issued.");
      return false;
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    const { error } = await supabase.rpc("register_push_token", {
      p_token: token,
      p_platform: Platform.OS === "ios" ? "ios" : "android",
    });
    if (error) {
      console.warn("[push] Couldn't save token:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[push] Registration failed:", err);
    return false;
  }
}

/** Remove this device's token on sign-out so the next user doesn't get the previous user's notifications. */
export async function unregisterPushToken() {
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId || !Device.isDevice) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from("push_tokens").delete().eq("token", token);
  } catch {
    // best effort
  }
}
