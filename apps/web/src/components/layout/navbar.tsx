"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Search as SearchIcon, ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { ProductImage } from "@/components/product/product-image";
import { categories } from "@/lib/data/categories";
import { useCart } from "@/lib/store/use-cart";
import { cn } from "@/lib/utils";
import { AccountMenu, MobileAccountLink } from "./account-menu";
import { Logo } from "./logo";
import { Search } from "./search";

const primaryLinks = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=apparel", label: "Apparel" },
  { href: "/shop?category=footwear", label: "Footwear" },
  { href: "/shop?category=accessories", label: "Accessories" },
  { href: "/shop?category=home", label: "Home" },
  { href: "/shop?sale=1", label: "Sale", accent: true },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overlays on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  // Checkout uses a focused, distraction-free header.
  const minimal = pathname.startsWith("/checkout");

  return (
    <>
      {!minimal && (
        <div className="bg-brand text-white">
          <p className="container-page flex h-9 items-center justify-center text-center text-xs font-medium tracking-wide sm:text-[0.8125rem]">
            Free standard shipping over $100
            <span className="mx-2 opacity-50" aria-hidden>
              ·
            </span>
            <span className="hidden sm:inline">30-day returns</span>
            <span className="sm:hidden">Easy returns</span>
          </p>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-canvas/90 backdrop-blur-md transition-[border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-canvas/80",
          scrolled ? "border-line shadow-[0_1px_0_rgb(0_0_0/0.02)]" : "border-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center gap-4 lg:h-[4.5rem] lg:gap-8">
          {!minimal && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="size-5" />
            </button>
          )}

          <Logo className={cn(!minimal && "max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2")} />

          {!minimal && (
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {primaryLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-subtle",
                        l.accent ? "text-sale" : "text-ink-soft hover:text-ink",
                        l.href === "/shop" && pathname === "/shop" && "text-ink",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {minimal ? (
              <Link href="/cart" className="text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                Back to bag
              </Link>
            ) : (
              <>
                <Search className="hidden w-64 md:block xl:w-80" />
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle md:hidden"
                  aria-label="Search"
                >
                  <SearchIcon className="size-5" />
                </button>
                <AccountMenu />
                <CartButton />
              </>
            )}
          </div>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={<Logo />} side="left">
        <MobileMenu onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <Drawer open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" side="top">
        <div className="p-5">
          <Search variant="panel" autoFocus onNavigate={() => setSearchOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}

function CartButton() {
  const { itemCount, hydrated } = useCart();
  return (
    <Link
      href="/cart"
      className="relative -mr-2 flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle sm:mr-0"
      aria-label={hydrated && itemCount ? `Shopping bag, ${itemCount} items` : "Shopping bag"}
    >
      <ShoppingBag className="size-5" />
      {hydrated && itemCount > 0 && (
        <span
          key={itemCount}
          className="absolute right-0.5 top-0.5 flex h-[1.125rem] min-w-[1.125rem] animate-toast-in items-center justify-center rounded-full bg-ink px-1 text-[0.6875rem] font-semibold tabular-nums text-white"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    // Close on any link click — query-only navigations do not change the pathname.
    <nav
      aria-label="Mobile"
      className="flex flex-col gap-8 p-5"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) onNavigate();
      }}
    >
      <ul className="flex flex-col">
        <li>
          <Link href="/shop" className="flex items-center justify-between py-3 text-lg font-medium text-ink">
            Shop all <ArrowRight className="size-4 text-ink-muted" />
          </Link>
        </li>
        <li>
          <Link href="/shop?sort=newest" className="flex items-center justify-between py-3 text-lg font-medium text-ink">
            New arrivals <ArrowRight className="size-4 text-ink-muted" />
          </Link>
        </li>
        <li>
          <Link href="/shop?sale=1" className="flex items-center justify-between py-3 text-lg font-medium text-sale">
            Sale <ArrowRight className="size-4" />
          </Link>
        </li>
      </ul>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Categories</p>
        <ul className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop?category=${c.slug}`} className="group block">
                <ProductImage src={c.image} alt="" sizes="45vw" className="aspect-[4/3] rounded-xl" imgClassName="group-hover:scale-105" />
                <span className="mt-2 block text-sm font-medium text-ink">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1 border-t border-line pt-6">
        <MobileAccountLink />
        <Link href="/cart" className="flex items-center gap-3 rounded-xl py-2.5 text-[0.9375rem] text-ink-soft hover:text-ink">
          <ShoppingBag className="size-5" /> Shopping bag
        </Link>
      </div>
    </nav>
  );
}
