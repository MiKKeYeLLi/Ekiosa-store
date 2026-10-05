/**
 * Mock imagery is hot-linked from Unsplash's CDN. When products move to a
 * real backend, image `src` values can point at any storage bucket — sizing
 * params are only appended for Unsplash URLs.
 */
export function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}`;
}

export const UNSPLASH_HOST = "images.unsplash.com";

/** Return a CDN-sized variant of an image URL (web loader, mobile app and emails). */
export function sizedImageUrl(src: string, width: number, quality = 75, height?: number): string {
  if (!src.includes(UNSPLASH_HOST)) return src;
  return `${src}?auto=format&fit=crop&w=${width}${height ? `&h=${height}` : ""}&q=${quality}`;
}
