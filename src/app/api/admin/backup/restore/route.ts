import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdminRequest } from "@/lib/admin-auth";

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

async function getLatestBackupFile(accessToken: string) {
  const query = "name contains 'manasa_upay_backup_' and trashed = false";
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,createdTime)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to list files from Google Drive");
  }

  const files = data.files || [];
  if (files.length === 0) {
    throw new Error("No backup files found in Google Drive.");
  }
  return files[0];
}

async function downloadFileContent(accessToken: string, fileId: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to download backup file from Google Drive: ${errorText || res.statusText}`);
  }

  return await res.json();
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service client not available" }, { status: 503 });
  }

  const startTime = new Date();
  let restoreStatus = "failed";
  let logMessage = "";
  let backupLogs: any[] = [];

  try {
    // 1. Fetch credentials
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

    // 2. Refresh Google token
    const accessToken = await refreshGoogleAccessToken(clientId, clientSecret, refreshToken);

    // 3. Find latest backup file
    const latestFile = await getLatestBackupFile(accessToken);
    logMessage = `Found latest backup file: ${latestFile.name} (ID: ${latestFile.id})`;

    // 4. Download file contents
    const backupData = await downloadFileContent(accessToken, latestFile.id);

    // 5. Restore database using RPC
    const { error: rpcErr } = await supabase.rpc("restore_backup_data", { backup_data: backupData });
    if (rpcErr) throw new Error(`Database restore RPC failed: ${rpcErr.message}`);

    restoreStatus = "success";
    logMessage = `Successfully restored database state from backup: ${latestFile.name}.`;
  } catch (err: any) {
    restoreStatus = "failed";
    logMessage = err.message || "Unknown restore error";
    console.error("Backup Restore error:", err);
  }

  // 6. Append restore operation log
  try {
    const newLog = {
      timestamp: startTime.toISOString(),
      type: "restore",
      status: restoreStatus,
      message: logMessage,
      size_kb: 0,
      file_id: ""
    };
    const updatedLogs = [newLog, ...backupLogs].slice(0, 50);

    await supabase
      .from("settings")
      .update({ value: JSON.stringify(updatedLogs) })
      .eq("key", "google_backup_logs");
  } catch (logErr) {
    console.error("Failed to write restore log to DB:", logErr);
  }

  if (restoreStatus === "success") {
    return NextResponse.json({ success: true, message: logMessage });
  } else {
    return NextResponse.json({ error: logMessage }, { status: 500 });
  }
}
