import { NextResponse } from "next/server";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

export async function GET() {
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const supabase = getAdminClient()!;

  const [users, businesses, ads] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("ads").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  return NextResponse.json({
    users: users.count ?? 0,
    businesses: businesses.count ?? 0,
    activeAds: ads.count ?? 0,
  });
}
