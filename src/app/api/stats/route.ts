import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const supabase = getAdminClient()!;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const sinceYesterday = yesterday.toISOString();

  const [users, newUsers, activeUsersToday, businesses, services, jobs, properties, resale, events, news, activeAds, sponsoredShops] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", sinceYesterday),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("updated_at", sinceYesterday),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("resale").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("ads").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("sponsored_shops").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    users: users.count ?? 0,
    activeUsersToday: activeUsersToday.count ?? newUsers.count ?? 0,
    newRegistrations: newUsers.count ?? 0,
    businesses: businesses.count ?? 0,
    services: services.count ?? 0,
    jobs: jobs.count ?? 0,
    properties: properties.count ?? 0,
    resale: resale.count ?? 0,
    events: events.count ?? 0,
    news: news.count ?? 0,
    activeAds: activeAds.count ?? 0,
    sponsoredShops: sponsoredShops.count ?? 0,
  });
}
