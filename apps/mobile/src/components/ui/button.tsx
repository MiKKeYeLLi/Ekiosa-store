import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./text";

type Variant = "primary" | "outline" | "ghost" | "light" | "success";
type Size = "md" | "lg" | "sm";

const bg: Record<Variant, string> = {
  primary: colors.brand,
  outline: colors.surface,
  ghost: "transparent",
  light: colors.white,
  success: colors.success,
};
const fg: Record<Variant, string> = {
  primary: colors.white,
  outline: colors.ink,
  ghost: colors.ink,
  light: colors.ink,
  success: colors.white,
};
const heights: Record<Size, number> = { sm: 38, md: 46, lg: 54 };

export function Button({
  title,
  icon,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  style,
  ...props
}: Omit<PressableProps, "style" | "children"> & {
  title: string;
  icon?: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant], height: heights[size], paddingHorizontal: size === "sm" ? 16 : 22 },
        variant === "outline" && styles.outline,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={fg[variant]} size="small" /> : icon}
      <Text style={{ color: fg[variant], fontFamily: fonts.medium, fontSize: size === "lg" ? 16 : 15 }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  children,
  label,
  onPress,
  style,
}: {
  children: ReactNode;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.icon, pressed && { backgroundColor: colors.subtle }, style]}
    >
      <View>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full },
  outline: { borderWidth: 1, borderColor: colors.lineStrong },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
