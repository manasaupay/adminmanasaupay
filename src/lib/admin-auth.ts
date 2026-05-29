import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "manasaupay@gmail.com";

function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim().replace(/\/$/, "");
  url = url.replace(/^https:\/\/db\./, "https://");
  return url;
}

export async function requireAdminRequest(req: NextRequest) {
  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return NextResponse.json(
      { error: "Admin auth is not configured." },
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin access denied." }, { status: 403 });
  }

  return null;
}
