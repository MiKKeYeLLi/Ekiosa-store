"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage as ProductImageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

/**
 * Mobile: swipeable, scroll-snapping carousel with dots.
 * Desktop: large stage with thumbnail rail and arrow controls.
 */
export function ProductGallery({ images, name }: { images: ProductImageType[]; name: string }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const multiple = images.length > 1;

  function go(index: number) {
    const next = (index + images.length) % images.length;
    setActive(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {multiple && (
        <div className="hidden gap-3 lg:flex lg:w-20 lg:flex-col" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              onClick={() => go(i)}
              className={cn(
                "relative overflow-hidden rounded-xl ring-1 transition-[box-shadow,opacity] duration-150",
                i === active ? "ring-2 ring-ink" : "ring-line opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={img.src} alt="" sizes="80px" className="aspect-[4/5]" />
            </button>
          ))}
        </div>
      )}

      <div className="group relative min-w-0 flex-1">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-3xl lg:overflow-hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
        >
          {images.map((img, i) => (
            <ProductImage
              key={img.src}
              src={img.src}
              alt={img.alt || name}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={i === 0}
              className="aspect-[4/5] w-full shrink-0 snap-center sm:aspect-square lg:aspect-[4/5]"
            />
          ))}
        </div>

        {multiple && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between px-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100 lg:flex">
              <GalleryArrow direction="prev" onClick={() => go(active - 1)} />
              <GalleryArrow direction="next" onClick={() => go(active + 1)} />
            </div>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden" aria-hidden>
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn("h-1.5 rounded-full bg-white shadow-card transition-all", i === active ? "w-5" : "w-1.5 opacity-60")}
                />
              ))}
            </div>
            <span className="absolute right-4 top-4 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium tabular-nums text-ink-soft shadow-card backdrop-blur">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function GalleryArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-surface/95 text-ink shadow-raised backdrop-blur transition-transform hover:scale-105 active:scale-95"
    >
      <Icon className="size-5" />
    </button>
  );
}
