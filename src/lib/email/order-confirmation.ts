/**
 * Order confirmation email (HTML + plain text). Table-based layout with
 * inline styles for broad email-client support.
 */
import { COUNTRIES } from "../checkout-validation";
import type { Order } from "../types";
import { formatDate, formatPrice } from "../utils";

const C = {
  canvas: "#fbfaf8",
  surface: "#ffffff",
  line: "#e4e0d8",
  ink: "#1b1a17",
  muted: "#6f6a60",
  brand: "#1f3d33",
  success: "#2f6b4a",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function deliveryWindow(order: Order) {
  const { from, to } = order.estimatedDelivery;
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  return from.slice(0, 10) === to.slice(0, 10) ? formatDate(from, opts) : `${formatDate(from, opts)} – ${formatDate(to, opts)}`;
}

function sizedImage(src: string) {
  return src.includes("images.unsplash.com") ? `${src}?auto=format&fit=crop&w=128&h=160&q=70` : src;
}

export function renderOrderConfirmation(order: Order, siteUrl: string): { subject: string; html: string; text: string } {
  const a = order.shippingAddress;
  const country = COUNTRIES.find((c) => c.value === a.country)?.label ?? a.country;
  const orderUrl = `${siteUrl.replace(/\/$/, "")}/order/${order.id}`;
  const delivery = deliveryWindow(order);
  const t = order.totals;

  const rows = order.lines
    .map(
      (l) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${C.line};width:64px;vertical-align:top">
          <img src="${esc(sizedImage(l.image))}" width="56" height="70" alt="" style="display:block;border-radius:8px;object-fit:cover;background:#f4f2ee">
        </td>
        <td style="padding:12px 12px;border-bottom:1px solid ${C.line};vertical-align:top;font-size:14px;color:${C.ink}">
          ${esc(l.name)}<br><span style="color:${C.muted};font-size:13px">Qty ${l.quantity} · ${formatPrice(l.unitPrice)} each</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${C.line};vertical-align:top;text-align:right;font-size:14px;color:${C.ink};white-space:nowrap">
          ${formatPrice(l.unitPrice * l.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
      <tr>
        <td style="padding:4px 0;font-size:${strong ? 16 : 14}px;color:${strong ? C.ink : C.muted};${strong ? "font-weight:600;padding-top:12px" : ""}">${label}</td>
        <td style="padding:4px 0;text-align:right;font-size:${strong ? 16 : 14}px;color:${C.ink};${strong ? "font-weight:600;padding-top:12px" : ""}">${value}</td>
      </tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order ${esc(order.number)} confirmed</title></head>
<body style="margin:0;padding:0;background:${C.canvas};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">Thanks for your order! Estimated delivery ${esc(delivery)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="padding:0 4px 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;color:${C.ink}">Loam<span style="color:${C.brand}">.</span></td></tr>
        <tr><td style="background:${C.surface};border:1px solid ${C.line};border-radius:20px;padding:32px 28px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${C.success}">Order confirmed</p>
          <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.15;color:${C.ink}">Thank you, ${esc(a.firstName)}.</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.muted}">We've received your order and we're getting it ready. We'll email you again when it ships.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.brand};border-radius:14px">
            <tr><td style="padding:18px 20px;color:#ffffff">
              <div style="font-size:12px;opacity:.75">Estimated delivery</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;margin-top:4px">${esc(delivery)}</div>
              <div style="font-size:12px;opacity:.75;margin-top:10px">Order ${esc(order.number)} · ${esc(order.shippingMethod.name)} shipping</div>
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">${rows}</table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
            ${totalRow("Subtotal", formatPrice(t.subtotal))}
            ${t.discount > 0 ? totalRow(`Discount${order.promo ? ` (${esc(order.promo.code)})` : ""}`, `−${formatPrice(t.discount)}`) : ""}
            ${totalRow("Shipping", t.shipping === 0 ? "Free" : formatPrice(t.shipping))}
            ${totalRow("Tax", formatPrice(t.tax))}
            ${totalRow("Total", formatPrice(t.total), true)}
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid ${C.line}">
            <tr><td style="padding-top:20px;font-size:14px;line-height:1.6;color:${C.muted}">
              <strong style="color:${C.ink}">Shipping to</strong><br>
              ${esc(`${a.firstName} ${a.lastName}`)}<br>${esc(a.address1)}${a.address2 ? `<br>${esc(a.address2)}` : ""}<br>
              ${esc(`${a.city}, ${a.region} ${a.postalCode}`)}<br>${esc(country)}
            </td></tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px">
            <tr><td style="background:${C.brand};border-radius:999px">
              <a href="${esc(orderUrl)}" style="display:inline-block;padding:14px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">View your order</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 4px;font-size:12px;line-height:1.6;color:${C.muted}">
          Questions? Just reply to this email.<br>© ${new Date().getFullYear()} Loam Goods Co.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Thank you, ${a.firstName}. Your order ${order.number} is confirmed.`,
    "",
    `Estimated delivery: ${delivery} (${order.shippingMethod.name})`,
    "",
    ...order.lines.map((l) => `- ${l.name} × ${l.quantity}: ${formatPrice(l.unitPrice * l.quantity)}`),
    "",
    `Subtotal: ${formatPrice(t.subtotal)}`,
    ...(t.discount > 0 ? [`Discount: -${formatPrice(t.discount)}`] : []),
    `Shipping: ${t.shipping === 0 ? "Free" : formatPrice(t.shipping)}`,
    `Tax: ${formatPrice(t.tax)}`,
    `Total: ${formatPrice(t.total)}`,
    "",
    "Shipping to:",
    `${a.firstName} ${a.lastName}`,
    a.address1,
    ...(a.address2 ? [a.address2] : []),
    `${a.city}, ${a.region} ${a.postalCode}`,
    country,
    "",
    `View your order: ${orderUrl}`,
  ].join("\n");

  return { subject: `Your Loam order ${order.number} is confirmed`, html, text };
}
