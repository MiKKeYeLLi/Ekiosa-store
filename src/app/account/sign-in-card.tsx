import { Heart, MapPin, Package } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignInCard({ next = "/account" }: { next?: string }) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <h1 className="font-display text-4xl tracking-tight text-ink">Welcome back</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-muted">Sign in to track orders, save favourites and check out faster.</p>

        <GoogleSignInButton next={next} className="mt-8" />

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          By continuing you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </div>

      <ul className="mt-8 grid gap-4 px-2 text-sm text-ink-muted">
        {[
          { icon: Package, text: "Track orders and view receipts" },
          { icon: Heart, text: "Save favourites across devices" },
          { icon: MapPin, text: "Faster checkout with your details filled in" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <Icon className="size-4 text-brand" aria-hidden /> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
