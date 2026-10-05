import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Mailgun tags help filter events in the dashboard. */
  tags?: string[];
}

export function isMailgunConfigured() {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM);
}

/** Send an email through the Mailgun Messages API. Throws on failure. */
export async function sendEmail(message: EmailMessage): Promise<{ id: string }> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM;
  const base = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";
  if (!apiKey || !domain || !from) throw new Error("Mailgun is not configured (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM).");

  const body = new FormData();
  body.set("from", from);
  body.set("to", message.to);
  body.set("subject", message.subject);
  body.set("html", message.html);
  body.set("text", message.text);
  for (const tag of message.tags ?? []) body.append("o:tag", tag);

  const res = await fetch(`${base}/v3/${encodeURIComponent(domain)}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mailgun responded ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? "" };
}
