/**
 * Mock imagery is hot-linked from Unsplash's CDN. When products move to a
 * real backend, image `src` values can point at any storage bucket — the
 * `ProductImage` component only appends sizing params for Unsplash URLs.
 */
export function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}`;
}

export const UNSPLASH_HOST = "images.unsplash.com";
