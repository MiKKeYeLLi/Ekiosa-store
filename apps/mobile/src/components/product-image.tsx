import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";
import { sizedImageUrl } from "@ekiosa/shared/images";
import { colors } from "@/theme";

/** Product photo sized at the CDN for the rendered width (pixel-ratio aware), with a fade-in. */
export function ProductImage({
  src,
  width,
  alt,
  style,
  priority,
}: {
  src: string;
  /** Rendered width in points — used to request an appropriately sized image. */
  width: number;
  alt?: string;
  style?: StyleProp<ImageStyle>;
  priority?: boolean;
}) {
  return (
    <Image
      source={src ? { uri: sizedImageUrl(src, Math.min(1200, Math.round(width * 2.5)), 70) } : undefined}
      accessibilityLabel={alt}
      contentFit="cover"
      transition={250}
      priority={priority ? "high" : "normal"}
      cachePolicy="memory-disk"
      style={[{ backgroundColor: colors.subtle }, style]}
    />
  );
}
