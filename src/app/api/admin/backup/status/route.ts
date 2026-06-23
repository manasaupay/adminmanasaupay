import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service client not available" }, { status: 503 });
  }

  try {
    const { data: dbSettings, error: fetchErr } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "google_backup_client_id",
        "google_backup_client_secret",
        "google_backup_refresh_token",
        "google_backup_schedule",
        "google_backup_last_status",
        "google_backup_logs"
      ]);

    if (fetchErr) throw new Error(fetchErr.message);

    const values: Record<string, string> = {};
    dbSettings?.forEach((s) => {
      values[s.key] = s.value || "";
    });

    const clientId = values["google_backup_client_id"] || process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = values["google_backup_client_secret"] || process.env.GOOGLE_CLIENT_SECRET || "";
    const refreshToken = values["google_backup_refresh_token"] || "";
    const scheduleStr = values["google_backup_schedule"] || "{}";
    const lastStatus = values["google_backup_last_status"] || "never";
    const logsStr = values["google_backup_logs"] || "[]";

    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const redirectUri = `${origin}/api/admin/backup/oauth`;

    let oauthUrl = "";
    if (clientId) {
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/drive.file",
        access_type: "offline",
        prompt: "consent"
      }).toString();
    }

    let schedule = {};
    try {
      schedule = JSON.parse(scheduleStr);
    } catch (_) {}

    let logs = [];
    try {
      logs = JSON.parse(logsStr);
    } catch (_) {}

    return NextResponse.json({
      connected: refreshToken.length > 0,
      hasCredentials: clientId.length > 0 && clientSecret.length > 0,
      oauthUrl,
      lastStatus,
      schedule,
      logs,
      clientId,
      clientSecret: clientSecret ? "••••••••••••" : ""
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch status" }, { status: 500 });
  }
}
