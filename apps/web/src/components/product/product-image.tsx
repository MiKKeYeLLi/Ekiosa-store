"use client";

import Image, { type ImageLoader } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { UNSPLASH_HOST } from "@/lib/data/images";
import { cn } from "@/lib/utils";

/**
 * Sizes images at the CDN instead of through the Next.js optimizer.
 * Unsplash (imgix) accepts width/quality params; other hosts get the raw URL.
 */
export const imageLoader: ImageLoader = ({ src, width, quality }) => {
  if (src.includes(UNSPLASH_HOST)) {
    return `${src}?auto=format&fit=crop&w=${width}&q=${quality ?? 75}`;
  }
  return src;
};

export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className={cn("relative overflow-hidden bg-subtle", className)}>
      {status === "error" || !src ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-faint">
          <ImageOff className="size-6" strokeWidth={1.5} aria-hidden />
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <>
          {status === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            loader={imageLoader}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={cn(
              "object-cover transition-[opacity,transform] duration-500 ease-out",
              status === "loaded" ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
          />
        </>
      )}
    </div>
  );
}
