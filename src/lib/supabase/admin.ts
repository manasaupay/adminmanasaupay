import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim().replace(/\/$/, "");
  url = url.replace(/^https:\/\/db\./, "https://");
  return url;
}

/** Server-side only — uses service role for admin CRUD. */
export function getAdminClient(): SupabaseClient | null {
  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  if (!_admin) {
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

export function getAdminConfigError(): string | null {
  if (!normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return "NEXT_PUBLIC_SUPABASE_URL missing or invalid (use https://REF.supabase.co)";
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "SUPABASE_SERVICE_ROLE_KEY missing in .env.local / Vercel";
  }
  return null;
}
