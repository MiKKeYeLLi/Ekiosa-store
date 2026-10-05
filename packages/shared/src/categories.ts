import type { Category } from "./types";
import { unsplash } from "./images";

export const categories: Category[] = [
  {
    slug: "apparel",
    name: "Apparel",
    description: "Considered essentials in natural fibres.",
    image: unsplash("1490481651871-ab68de25d43d"),
  },
  {
    slug: "footwear",
    name: "Footwear",
    description: "Sneakers, boots and leather shoes built to last.",
    image: unsplash("1449505278894-297fdb3edbc1"),
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Bags, watches and finishing touches.",
    image: unsplash("1553062407-98eeb64c6a62"),
  },
  {
    slug: "audio-tech",
    name: "Audio & Tech",
    description: "Sound and gear that stays out of the way.",
    image: unsplash("1505740420928-5e560c06d30e"),
  },
  {
    slug: "home",
    name: "Home & Living",
    description: "Furniture, lighting and objects for slow living.",
    image: unsplash("1493663284031-b7e3aefcae8e"),
  },
  {
    slug: "beauty",
    name: "Beauty",
    description: "Clean, effective skin and body care.",
    image: unsplash("1612817288484-6f916006741a"),
  },
];

export function getCategoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
