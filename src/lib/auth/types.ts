export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

type Metadata = Record<string, unknown> | undefined;

/** Build a SessionUser from Supabase user/claims fields (Google puts name/picture in user_metadata). */
export function toSessionUser(id: string, email: string | undefined, meta: Metadata): SessionUser {
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id,
    email: email ?? "",
    fullName: str(meta?.full_name) ?? str(meta?.name),
    avatarUrl: str(meta?.avatar_url) ?? str(meta?.picture),
  };
}

export function splitName(fullName: string | null): { firstName: string; lastName: string } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** Only allow same-site relative redirects (blocks `//evil.com` and absolute URLs). */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
