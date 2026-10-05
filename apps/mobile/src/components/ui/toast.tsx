import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, shadow } from "@/theme";
import { ProductImage } from "../product-image";
import { Text } from "./text";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
  image?: string;
  action?: { label: string; onPress: () => void };
  duration?: number;
}

const ToastContext = createContext<{ toast: (o: ToastOptions) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/** One toast at a time, shown above the tab bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(ToastOptions & { id: number }) | null>(null);
  const id = useRef(0);
  const toast = useCallback((o: ToastOptions) => setCurrent({ tone: "success", duration: 3500, ...o, id: ++id.current }), []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && <ToastView key={current.id} toast={current} onDone={() => setCurrent(null)} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: ToastOptions; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 4 }).start();
    const t = setTimeout(() => Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onDone), toast.duration);
    return () => clearTimeout(t);
  }, [anim, onDone, toast.duration]);

  const icon = toast.tone === "error" ? "alert-circle" : toast.tone === "info" ? "info" : "check-circle";
  const iconColor = toast.tone === "error" ? colors.danger : toast.tone === "info" ? colors.inkMuted : colors.success;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom: insets.bottom + 72, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}
    >
      <View style={[styles.card, shadow.pop]} accessibilityLiveRegion="polite" accessibilityRole={toast.tone === "error" ? "alert" : undefined}>
        {toast.image ? (
          <ProductImage src={toast.image} width={96} style={{ width: 44, height: 52, borderRadius: 8 }} />
        ) : (
          <Feather name={icon} size={20} color={iconColor} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.ink }}>{toast.title}</Text>
          {toast.description ? (
            <Text variant="caption" numberOfLines={2}>
              {toast.description}
            </Text>
          ) : null}
        </View>
        {toast.action && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              toast.action?.onPress();
              onDone();
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.brand }}>{toast.action.label}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 12 },
});
