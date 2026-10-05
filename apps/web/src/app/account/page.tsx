import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProductImage } from "@/components/product/product-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getUser } from "@/lib/auth/get-user";
import { safeNextPath } from "@/lib/auth/types";
import { getMyOrders } from "@/lib/services/orders-server";
import { formatDate, formatPrice, pluralize } from "@/lib/utils";
import { SignInCard } from "./sign-in-card";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined, "/account");
  const user = await getUser();

  if (!user) {
    return (
      <div className="container-page flex justify-center py-12 sm:py-20">
        <SignInCard next={next} />
      </div>
    );
  }
  // Signed in and arrived via a "sign in to continue" link — go where they were headed.
  if (next !== "/account") redirect(next);

  const orders = await getMyOrders();

  return (
    <div className="container-page pt-8 sm:pt-12">
      <header className="flex flex-wrap items-center gap-5 border-b border-line pb-8">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- small remote avatar
          <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-16 rounded-full" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-brand text-2xl font-medium text-white">
            {(user.fullName ?? user.email).charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[2.25rem] leading-none tracking-tight text-ink sm:text-5xl">
            {user.fullName ? `Hi, ${user.fullName.split(" ")[0]}` : "Your account"}
          </h1>
          <p className="mt-2 truncate text-sm text-ink-muted">{user.email}</p>
        </div>
        <SignOutButton className="h-10 rounded-full border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-subtle" />
      </header>

      <section className="mt-10" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-xl font-medium tracking-tight text-ink">
          Your orders
        </h2>
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order, it will show up here."
            action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
            className="py-12 sm:py-16"
          />
        ) : (
          <ul className="mt-6 divide-y divide-line rounded-3xl border border-line bg-surface">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/order/${o.id}`} className="group flex items-center gap-4 p-4 transition-colors hover:bg-subtle sm:p-5">
                  <div className="flex -space-x-3">
                    {o.lines.slice(0, 3).map((l) => (
                      <ProductImage
                        key={l.productId}
                        src={l.image}
                        alt=""
                        sizes="48px"
                        className="aspect-[4/5] w-12 rounded-lg ring-2 ring-surface"
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium text-ink">{o.number}</p>
                    <p className="text-[0.8125rem] text-ink-muted">
                      {formatDate(o.createdAt, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                      {pluralize(o.lines.reduce((n, l) => n + l.quantity, 0), "item")}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-success-tint px-2.5 py-1 text-xs font-medium text-success sm:inline">
                    Confirmed
                  </span>
                  <span className="text-sm font-medium tabular-nums text-ink">{formatPrice(o.totals.total)}</span>
                  <ChevronRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
