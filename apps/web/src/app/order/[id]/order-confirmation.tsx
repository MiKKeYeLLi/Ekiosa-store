"use client";

import { useState } from "react";
import { CalendarDays, Check, Copy, CreditCard, Mail, MapPin, Printer, Truck } from "lucide-react";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { COUNTRIES } from "@/lib/checkout-validation";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function OrderConfirmation({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  const a = order.shippingAddress;
  const country = COUNTRIES.find((c) => c.value === a.country)?.label ?? a.country;
  const sameDay = order.estimatedDelivery.from.slice(0, 10) === order.estimatedDelivery.to.slice(0, 10);

  return (
    <div className="container-page pt-10 sm:pt-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16 xl:grid-cols-[1fr_28rem] xl:gap-24">
        <div>
          <div className="flex size-14 animate-toast-in items-center justify-center rounded-full bg-success text-white">
            <Check className="size-7" strokeWidth={2.5} aria-hidden />
          </div>
          <p className="mt-8 text-sm font-medium text-success">Order confirmed</p>
          <h1 className="mt-2 font-display text-[2.5rem] leading-[1.02] tracking-tight text-ink sm:text-6xl">
            Thank you, {a.firstName}.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-muted">
            Your order is confirmed and we&apos;re getting it ready. A confirmation email is on its way to{" "}
            <span className="font-medium text-ink">{order.contact.email}</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.08em] text-ink-muted">Order number</p>
              <p className="mt-1 font-mono text-lg font-medium tracking-wide text-ink">{order.number}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(order.number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="mt-6 rounded-2xl bg-brand p-5 text-white sm:p-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 shrink-0 opacity-80" aria-hidden />
              <p className="text-sm text-white/75">Estimated delivery</p>
            </div>
            <p className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
              {sameDay
                ? formatDate(order.estimatedDelivery.from, { weekday: "long", month: "long", day: "numeric" })
                : `${formatDate(order.estimatedDelivery.from)} – ${formatDate(order.estimatedDelivery.to)}`}
            </p>
            <ol className="mt-6 grid grid-cols-3 gap-2 text-xs" aria-label="Order progress">
              {["Confirmed", "Shipped", "Delivered"].map((step, i) => (
                <li key={step}>
                  <span className={`block h-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/25"}`} />
                  <span className={`mt-2 block ${i === 0 ? "font-medium text-white" : "text-white/60"}`}>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard icon={MapPin} title="Shipping to">
              {a.firstName} {a.lastName}
              <br />
              {a.address1}
              {a.address2 && (
                <>
                  <br />
                  {a.address2}
                </>
              )}
              <br />
              {a.city}, {a.region} {a.postalCode}
              <br />
              {country}
            </InfoCard>
            <InfoCard icon={Truck} title="Delivery method">
              {order.shippingMethod.name} · {order.shippingMethod.description}
              <br />
              {order.shippingMethod.minDays === order.shippingMethod.maxDays
                ? `${order.shippingMethod.minDays} business day`
                : `${order.shippingMethod.minDays}–${order.shippingMethod.maxDays} business days`}
            </InfoCard>
            <InfoCard icon={Mail} title="Contact">
              {order.contact.email}
              {order.contact.phone && (
                <>
                  <br />
                  {order.contact.phone}
                </>
              )}
            </InfoCard>
            <InfoCard icon={CreditCard} title="Payment">
              Demo payment — no charge made
              <br />
              Placed {formatDate(order.createdAt, { month: "short", day: "numeric", year: "numeric" })}
            </InfoCard>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 print:hidden">
            <ButtonLink href="/shop" size="lg">
              Continue shopping
            </ButtonLink>
            <Button variant="outline" size="lg" onClick={() => window.print()}>
              <Printer className="size-4" /> Print receipt
            </Button>
          </div>
        </div>

        <aside>
          <div className="lg:sticky lg:top-28">
            <OrderSummary
              title="Your order"
              lines={order.lines}
              totals={order.totals}
              promo={order.promo}
              shippingLabel={order.shippingMethod.name}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon className="size-4 text-ink-muted" aria-hidden /> {title}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
