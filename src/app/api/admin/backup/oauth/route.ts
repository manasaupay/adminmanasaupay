import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const redirectUri = `${origin}/api/admin/backup/oauth`;

  if (errorParam) {
    return NextResponse.redirect(`${origin}/settings?backup_error=${encodeURIComponent(errorParam)}`);
  }

  if (!code) {
    return NextResponse.json({ error: "Code query parameter is required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service client not available" }, { status: 503 });
  }

  try {
    // 1. Fetch Google credentials from settings
    const { data: settings, error: fetchErr } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["google_backup_client_id", "google_backup_client_secret"]);

    if (fetchErr) throw new Error(fetchErr.message);

    const clientId = settings?.find((s) => s.key === "google_backup_client_id")?.value || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = settings?.find((s) => s.key === "google_backup_client_secret")?.value || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google Client ID or Client Secret not configured in settings or environment variables.");
    }

    // 2. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange authorization code");
    }

    const { refresh_token } = tokenData;
    if (!refresh_token) {
      throw new Error("No refresh token returned. If already linked, please disconnect the app from Google Account settings and link again.");
    }

    // 3. Save refresh token in database settings
    const { error: updateErr } = await supabase
      .from("settings")
      .update({ value: refresh_token })
      .eq("key", "google_backup_refresh_token");

    if (updateErr) throw new Error(updateErr.message);

    // 4. Update status to connected
    await supabase
      .from("settings")
      .update({ value: `connected_at_${new Date().toISOString()}` })
      .eq("key", "google_backup_last_status");

    // Redirect user back to settings with success
    return NextResponse.redirect(`${origin}/settings?backup_connected=true`);
  } catch (err: any) {
    console.error("Backup OAuth error:", err);
    return NextResponse.redirect(`${origin}/settings?backup_error=${encodeURIComponent(err.message || "Unknown error occurred")}`);
  }
}
