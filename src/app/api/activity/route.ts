import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type ActivityRangeKey = "today" | "24h" | "7d" | "30d";
type ActivityEvent = { id: string; time: string; event: string; type: string };

const activitySources: Array<{
  table: string;
  type: string;
  label: string;
}> = [
  { table: "users", type: "user", label: "New user joined" },
  { table: "businesses", type: "business", label: "New business submitted" },
  { table: "ads", type: "ads", label: "New ad placement created" },
  { table: "notifications", type: "notif", label: "Notification saved" },
  { table: "properties", type: "property", label: "Property listed" },
  { table: "resale", type: "property", label: "Resale item listed" },
  { table: "events", type: "event", label: "Event published" },
  { table: "news", type: "news", label: "News item posted" },
];

function getSinceForRange(range: ActivityRangeKey) {
  const now = new Date();
  switch (range) {
    case "today":
      now.setHours(0, 0, 0, 0);
      return now.toISOString();
    case "24h":
      now.setHours(now.getHours() - 24);
      return now.toISOString();
    case "7d":
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case "30d":
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    default:
      now.setHours(now.getHours() - 24);
      return now.toISOString();
  }
}

async function fetchActivityRows(supabase: ReturnType<typeof getAdminClient>, table: string, since: string) {
  const { data, error } = await supabase
    .from(table)
    .select("id,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error || !data) return [];
  return data;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const supabase = getAdminClient();
  const rangeParam = req.nextUrl.searchParams.get("range") as ActivityRangeKey | null;
  const range: ActivityRangeKey = rangeParam === "today" || rangeParam === "24h" || rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "24h";
  const since = getSinceForRange(range);

  const results = await Promise.all(
    activitySources.map(async (source) => {
      const rows = await fetchActivityRows(supabase!, source.table, since);
      return rows.map((row: any) => ({
        id: `${source.table}-${String(row.id)}`,
        time: row.created_at ?? "Unknown",
        event: source.label,
        type: source.type,
      } as ActivityEvent));
    })
  );

  const activities = results.flat().sort((a, b) => {
    const aTime = new Date(a.time).getTime();
    const bTime = new Date(b.time).getTime();
    return bTime - aTime;
  });

  return NextResponse.json({ activities: activities.slice(0, 12) });
}
