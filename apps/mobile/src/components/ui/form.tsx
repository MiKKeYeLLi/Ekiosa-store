/** Form controls: Input, Checkbox, QuantitySelector. */
import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./text";

export const Input = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string; optional?: boolean; containerStyle?: StyleProp<ViewStyle> }>(
  function Input({ label, error, hint, optional, containerStyle, style, onFocus, onBlur, ...props }, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={[{ gap: 6 }, containerStyle]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.inkSoft }}>{label}</Text>
          {optional && <Text variant="caption" style={{ fontSize: 12 }}>Optional</Text>}
        </View>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.inkFaint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          style={[
            styles.input,
            focused && { borderColor: colors.ink },
            !!error && { borderColor: colors.danger },
            props.editable === false && { backgroundColor: colors.subtle, color: colors.inkMuted },
            style,
          ]}
          {...props}
        />
        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="alert-circle" size={13} color={colors.danger} />
            <Text style={{ fontSize: 13, color: colors.danger }} accessibilityRole="alert">
              {error}
            </Text>
          </View>
        ) : hint ? (
          <Text variant="caption">{hint}</Text>
        ) : null}
      </View>
    );
  },
);

export function Checkbox({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", opacity: disabled ? 0.5 : 1 }}
    >
      <View style={[styles.box, checked && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
        {checked && <Feather name="check" size={13} color={colors.white} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14.5, color: colors.inkSoft }}>{label}</Text>
        {description ? <Text variant="caption">{description}</Text> : null}
      </View>
    </Pressable>
  );
}

export function QuantitySelector({ value, onChange, min = 1, max = 99, size = "md" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: "sm" | "md" }) {
  const h = size === "sm" ? 36 : 48;
  return (
    <View style={[styles.qty, { height: h }]} accessibilityLabel={`Quantity ${value}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.qtyBtn, { width: h }, value <= min && { opacity: 0.35 }]}
      >
        <Feather name="minus" size={15} color={colors.ink} />
      </Pressable>
      <Text style={{ minWidth: 28, textAlign: "center", fontFamily: fonts.medium, fontSize: 15, color: colors.ink }}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.qtyBtn, { width: h }, value >= max && { opacity: 0.35 }]}
      >
        <Feather name="plus" size={15} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 15.5,
    color: colors.ink,
  },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center", marginTop: 1 },
  qty: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, backgroundColor: colors.surface },
  qtyBtn: { height: "100%", alignItems: "center", justifyContent: "center" },
});
