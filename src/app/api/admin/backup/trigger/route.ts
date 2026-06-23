import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdminRequest } from "@/lib/admin-auth";

const TABLES_TO_BACKUP = [
  "categories",
  "users",
  "businesses",
  "services",
  "auto_drivers",
  "jobs",
  "products",
  "ads",
  "sponsored_shops",
  "updates",
  "news",
  "events",
  "offers",
  "properties",
  "resale",
  "reviews",
  "analytics",
  "call_sessions",
  "chat_threads",
  "chat_messages",
  "settings"
];

async function refreshGoogleAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Failed to refresh Google access token");
  }
  return data.access_token;
}

async function uploadToGoogleDrive(accessToken: string, filename: string, content: string) {
  const metadata = {
    name: filename,
    mimeType: "application/json",
  };

  const boundary = "manasa_upay_backup_boundary";
  const multipartBody = 
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `\r\n--${boundary}--\r\n`;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(multipartBody.length),
    },
    body: multipartBody,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to upload to Google Drive");
  }
  return data.id;
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service client not available" }, { status: 503 });
  }

  const startTime = new Date();
  let backupStatus = "failed";
  let backupLogs: any[] = [];
  let logMessage = "";
  let sizeBytes = 0;
  let fileId = "";

  try {
    // 1. Fetch credentials from settings
    const { data: dbSettings, error: fetchErr } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "google_backup_client_id",
        "google_backup_client_secret",
        "google_backup_refresh_token",
        "google_backup_logs"
      ]);

    if (fetchErr) throw new Error(fetchErr.message);

    const values: Record<string, string> = {};
    dbSettings?.forEach((s) => {
      values[s.key] = s.value || "";
    });

    const clientId = values["google_backup_client_id"] || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = values["google_backup_client_secret"] || process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = values["google_backup_refresh_token"];
    const existingLogsStr = values["google_backup_logs"] || "[]";

    try {
      backupLogs = JSON.parse(existingLogsStr);
    } catch (_) {}

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Google Backup is not connected or client credentials are missing.");
    }

    // 2. Export database tables
    const backupData: Record<string, any[]> = {};
    for (const table of TABLES_TO_BACKUP) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw new Error(`Table export failed (${table}): ${error.message}`);
      backupData[table] = data || [];
    }

    const jsonString = JSON.stringify(backupData);
    sizeBytes = Blob ? new Blob([jsonString]).size : Buffer.from(jsonString).length;

    // 3. Authenticate with Google
    const accessToken = await refreshGoogleAccessToken(clientId, clientSecret, refreshToken);

    // 4. Upload to Google Drive
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "_").slice(0, 19);
    const filename = `manasa_upay_backup_${timestamp}.json`;
    fileId = await uploadToGoogleDrive(accessToken, filename, jsonString);

    backupStatus = "success";
    logMessage = `Manual backup successfully uploaded to Google Drive. File ID: ${fileId}.`;
  } catch (err: any) {
    backupStatus = "failed";
    logMessage = err.message || "Unknown backup error";
    console.error("Backup Trigger error:", err);
  }

  // 5. Update settings metadata & logs
  try {
    const newLog = {
      timestamp: startTime.toISOString(),
      type: "manual",
      status: backupStatus,
      message: logMessage,
      size_kb: Math.round(sizeBytes / 1024 * 100) / 100,
      file_id: fileId
    };
    
    const updatedLogs = [newLog, ...backupLogs].slice(0, 50); // Keep last 50 logs

    await supabase
      .from("settings")
      .update({ value: JSON.stringify(updatedLogs) })
      .eq("key", "google_backup_logs");

    await supabase
      .from("settings")
      .update({ value: `${backupStatus}_at_${new Date().toISOString()}` })
      .eq("key", "google_backup_last_status");
  } catch (logErr) {
    console.error("Failed to write backup logs to DB:", logErr);
  }

  if (backupStatus === "success") {
    return NextResponse.json({ success: true, message: logMessage, fileId });
  } else {
    return NextResponse.json({ error: logMessage }, { status: 500 });
  }
}
