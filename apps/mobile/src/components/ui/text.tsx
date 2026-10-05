import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption" | "eyebrow";

const variants = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.6, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.4, color: colors.ink },
  heading: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.ink },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  eyebrow: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: "uppercase", color: colors.inkFaint },
});

export function Text({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText {...props} style={[variants[variant], style]} />;
}
