"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { categories } from "@/lib/data/categories";
import { Logo } from "./logo";

const columns = [
  { title: "Shop", links: categories.map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })) },
  {
    title: "Help",
    links: [
      { label: "Shipping & delivery", href: "/shop" },
      { label: "Returns & exchanges", href: "/shop" },
      { label: "Order status", href: "/account" },
      { label: "Contact us", href: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Ekiosa", href: "/" },
      { label: "Sustainability", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Journal", href: "/" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) {
    return (
      <footer className="border-t border-line py-8 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Ekiosa · Secure checkout
      </footer>
    );
  }

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr] lg:gap-20">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
            Considered goods for everyday living — made to last, priced honestly, and shipped carbon-neutral.
          </p>
          <Newsletter />
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-medium text-ink">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ekiosa All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="hover:text-ink">Privacy</Link>
            <Link href="/" className="hover:text-ink">Terms</Link>
            <Link href="/" className="hover:text-ink">Accessibility</Link>
            <span>USD $ · United States</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** UI-only newsletter signup; wire to an email provider later. */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  return (
    <form
      className="mt-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setState(/^\S+@\S+\.\S+$/.test(email) ? "done" : "error");
      }}
    >
      <label htmlFor="newsletter" className="text-sm font-medium text-ink">
        Get 10% off your first order
      </label>
      {state === "done" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-success" role="status">
          <Check className="size-4" /> You&apos;re on the list. Use code WELCOME10 at checkout.
        </p>
      ) : (
        <>
          <div className="mt-3 flex h-12 items-center rounded-full border border-line bg-canvas pl-4 pr-1.5 transition-colors focus-within:border-ink">
            <input
              id="newsletter"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder="you@example.com"
              aria-invalid={state === "error" || undefined}
              aria-describedby={state === "error" ? "newsletter-error" : undefined}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              className="flex size-9 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink-soft"
              aria-label="Subscribe"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
          {state === "error" && (
            <p id="newsletter-error" className="mt-2 text-[0.8125rem] text-danger" role="alert">
              Please enter a valid email address.
            </p>
          )}
        </>
      )}
    </form>
  );
}
