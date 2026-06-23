"use client";

import { useEffect, useState } from "react";

type Setting = {
  id: string;
  key: string;
  setting_type: "string" | "boolean" | "number" | "json" | "url" | "color";
  group_name: string;
  value: string;
  description: string;
  meta?: {
    help_text?: string;
  };
  active: boolean;
};

const SETTINGS_INFO = {
  title: "Platform Engine Configuration",
  description: "Direct control variables for the Manasa Upay hyperlocal app engines, branding elements, push notifications, and monetization systems.",
  sections: [
    {
      title: "App Branding",
      desc: "App name and tagline showing up on user home screens, share cards, and deep link metadata.",
      image_recommendation: "Logos: 512 x 512 px PNG. Cover Images: 1200 x 600 px."
    },
    {
      title: "Core Features",
      desc: "Instant kill-switches to enable or disable global modules (like search, listings creation, or calling options) in real-time.",
      image_recommendation: "None."
    },
    {
      title: "Operational Directories",
      desc: "Instant switches to hide or display specific modules (Shops, Services, Auto Booking, Jobs, Properties, Resale, News, Events) across the mobile app.",
      image_recommendation: "None."
    },
    {
      title: "Marketing & Ads",
      desc: "Enable/disable layout banners and sponsored priority rules. Set target advertisement click behaviors.",
      image_recommendation: "Banner Ad: 800 x 300 px. Popups: 600 x 600 px."
    },
    {
      title: "General & Support",
      desc: "Customer support numbers and WhatsApp redirection contact details.",
      image_recommendation: "None."
    },
    {
      title: "Google Drive Backups",
      desc: "Configure automated cloud database backups directly to your Google Drive account, with database state restoration.",
      image_recommendation: "None."
    }
  ]
};

type BackupStatus = {
  connected: boolean;
  hasCredentials: boolean;
  oauthUrl: string;
  lastStatus: string;
  schedule: { time: string; days: string[]; enabled: boolean };
  logs: Array<{
    timestamp: string;
    type: "manual" | "auto" | "restore";
    status: "success" | "failed";
    message: string;
    size_kb?: number;
    file_id?: string;
  }>;
  clientId: string;
  clientSecret: string;
};

export default function RedesignedSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("branding");
  const [showInfo, setShowInfo] = useState(false);

  // Backup system state
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupActionLoading, setBackupActionLoading] = useState<string | null>(null);
  const [credClientId, setCredClientId] = useState("");
  const [credClientSecret, setCredClientSecret] = useState("");

  // Temporary local values for edit states before saving
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load settings");
      
      const list: Setting[] = Array.isArray(data) ? data : [];
      setSettings(list);
      
      // Initialize local values map
      const valuesMap: Record<string, string> = {};
      list.forEach((s) => {
        valuesMap[s.id] = s.value;
      });
      setLocalValues(valuesMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error fetching settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupStatus = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/admin/backup/status");
      if (res.ok) {
        const data = await res.json();
        setBackupStatus(data);
        setCredClientId(data.clientId || "");
        setCredClientSecret(""); // Keep blank to avoid showing saved secret
      }
    } catch (e) {
      console.error("Failed to fetch backup status", e);
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Check query params for backup outcomes
    const params = new URLSearchParams(window.location.search);
    if (params.get("backup_connected") === "true") {
      setSuccessMsg("Google Drive account linked successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else if (params.get("backup_error")) {
      setError(decodeURIComponent(params.get("backup_error") || ""));
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setError(null), 7000);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "backups") {
      fetchBackupStatus();
    }
  }, [activeTab, settings]);

  const saveSetting = async (id: string, newValue: string, newActive?: boolean) => {
    setSavingId(id);
    setError(null);
    setSuccessMsg(null);
    
    // Find original setting to get keys and types
    const original = settings.find((s) => s.id === id);
    if (!original) return;

    try {
      const updates: Record<string, unknown> = {
        value: newValue,
      };
      if (newActive !== undefined) {
        updates.active = newActive;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save setting");

      // Update local state list
      setSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, value: newValue, active: newActive !== undefined ? newActive : s.active } : s))
      );
      
      setSuccessMsg(`Setting "${original.key}" updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update setting");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = (id: string, currentValue: string, currentActive: boolean) => {
    const nextValue = currentValue === "true" ? "false" : "true";
    setLocalValues((prev) => ({ ...prev, [id]: nextValue }));
    saveSetting(id, nextValue, currentActive);
  };

  const handleActiveToggle = (id: string, currentValue: string, currentActive: boolean) => {
    saveSetting(id, currentValue, !currentActive);
  };

  const handleSaveCredentials = async () => {
    const cidSetting = settings.find((s) => s.key === "google_backup_client_id");
    const csecSetting = settings.find((s) => s.key === "google_backup_client_secret");
    
    if (!cidSetting || !csecSetting) {
      setError("Backup settings not seeded in database. Please run migrations first.");
      return;
    }

    setBackupActionLoading("credentials");
    try {
      await saveSetting(cidSetting.id, credClientId);
      if (credClientSecret) {
        await saveSetting(csecSetting.id, credClientSecret);
      }
      setSuccessMsg("Google OAuth credentials saved.");
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchBackupStatus();
    } catch (e: any) {
      setError(e.message || "Failed to save credentials");
    } finally {
      setBackupActionLoading(null);
    }
  };

  const handleDisconnectBackup = async () => {
    if (!confirm("Are you sure you want to unlink your Google Drive account?")) return;
    const tokenSetting = settings.find((s) => s.key === "google_backup_refresh_token");
    if (!tokenSetting) return;

    setBackupActionLoading("disconnect");
    try {
      await saveSetting(tokenSetting.id, "");
      setSuccessMsg("Google Account disconnected successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchBackupStatus();
    } catch (e: any) {
      setError(e.message || "Failed to disconnect");
    } finally {
      setBackupActionLoading(null);
    }
  };

  const handleUpdateSchedule = async (newSchedule: any) => {
    const scheduleSetting = settings.find((s) => s.key === "google_backup_schedule");
    if (!scheduleSetting) return;

    setBackupActionLoading("schedule");
    try {
      await saveSetting(scheduleSetting.id, JSON.stringify(newSchedule));
      setSuccessMsg("Backup schedule updated.");
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchBackupStatus();
    } catch (e: any) {
      setError(e.message || "Failed to update schedule");
    } finally {
      setBackupActionLoading(null);
    }
  };

  const handleBackupNow = async () => {
    if (!confirm("Are you sure you want to trigger a manual backup to Google Drive now?")) return;
    setBackupActionLoading("backup");
    try {
      const res = await fetch("/api/admin/backup/trigger", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backup failed");
      setSuccessMsg("Backup successfully uploaded to Google Drive.");
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchBackupStatus();
    } catch (e: any) {
      setError(e.message || "Failed to trigger backup");
    } finally {
      setBackupActionLoading(null);
    }
  };

  const handleRestoreNow = async () => {
    if (!confirm("WARNING: This will overwrite all tables in your database with the latest Google Drive backup. This cannot be undone. Are you sure you want to proceed?")) return;
    setBackupActionLoading("restore");
    try {
      const res = await fetch("/api/admin/backup/restore", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");
      setSuccessMsg("Database successfully restored from latest Google Drive backup.");
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchBackupStatus();
    } catch (e: any) {
      setError(e.message || "Failed to restore database");
    } finally {
      setBackupActionLoading(null);
    }
  };

  const groupedSettings = settings.reduce((acc, curr) => {
    const group = curr.group_name;
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, Setting[]>);

  const tabs = [
    { key: "branding", label: "App Branding", icon: "🎨" },
    { key: "features", label: "Core Features", icon: "⚡" },
    { key: "directories", label: "Operational Directories", icon: "📁" },
    { key: "ads", label: "Marketing & Ads", icon: "📢" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
    { key: "backups", label: "Google Backup", icon: "☁️" },
    { key: "general", label: "General Config", icon: "⚙️" },
  ];

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      {/* Settings Header Block */}
      <section className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">Platform Control Engine</h1>
              <button
                onClick={() => setShowInfo(true)}
                title="Show settings guide"
                className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5 text-teal-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={fetchSettings}
                disabled={loading}
                title="Sync Settings"
                className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <svg className={`h-4 w-4 ${loading ? "animate-spin text-teal-500" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 font-medium max-w-xl">
              Reinnovated control center. Real-time variables modification instantly reflecting on users mobile devices.
            </p>
          </div>
          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm animate-fade-in flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              {successMsg}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 shadow-sm animate-shake">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Main Tabbed Grid */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Modern Tab Selector Sidebar */}
        <aside className="glass-card rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm h-fit space-y-1.5">
          <p className="px-3.5 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Settings Groups</p>
          {tabs.map((tab) => {
            const count = tab.key === "backups" ? (backupStatus?.connected ? 1 : 0) : (groupedSettings[tab.key]?.length ?? 0);
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-teal-50 text-teal-700 border border-teal-100 shadow-[0_2px_4px_rgba(13,148,136,0.04)]"
                    : "text-slate-650 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm shrink-0">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                  active ? "bg-white border-teal-200 text-teal-700" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Dynamic Settings Fields Card */}
        <section className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 capitalize">{activeTab === "backups" ? "Google Backup Dashboard" : `${activeTab} Controls`}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === "backups" 
                ? "Configure automated background and manual database backups to Google Drive." 
                : "Edit active config values below. Changes apply instantly."}
            </p>
          </div>

          {activeTab === "backups" ? (
            backupLoading || !backupStatus ? (
              <div className="flex flex-col items-center gap-3 py-16 justify-center">
                <span className="h-4 w-4 rounded-full bg-teal-500 glow-active shadow-[0_0_12px_rgba(20,184,166,0.4)] animate-pulse" />
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing backup status...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. Google OAuth Setup Card */}
                <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50/40 space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">1. Google API Connection</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Link a Google Account to enable database exports directly to Google Drive.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">Google OAuth Client ID</label>
                      <input
                        type="text"
                        value={credClientId}
                        onChange={(e) => setCredClientId(e.target.value)}
                        placeholder="Paste Google Client ID"
                        className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400">Google OAuth Client Secret</label>
                      <input
                        type="password"
                        value={credClientSecret}
                        onChange={(e) => setCredClientSecret(e.target.value)}
                        placeholder={backupStatus.hasCredentials ? "••••••••••••" : "Paste Google Client Secret"}
                        className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500/40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      disabled={backupActionLoading === "credentials"}
                      onClick={handleSaveCredentials}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                    >
                      {backupActionLoading === "credentials" ? "Saving..." : "Save Credentials"}
                    </button>

                    <div className="flex items-center gap-3">
                      {backupStatus.connected ? (
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Account Connected
                          </span>
                          <button
                            type="button"
                            disabled={backupActionLoading === "disconnect"}
                            onClick={handleDisconnectBackup}
                            className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                          >
                            {backupActionLoading === "disconnect" ? "Disconnecting..." : "Disconnect Account"}
                          </button>
                        </div>
                      ) : backupStatus.oauthUrl ? (
                        <a
                          href={backupStatus.oauthUrl}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-[0_2px_8px_rgba(13,148,136,0.15)]"
                        >
                          Link Google Account
                        </a>
                      ) : (
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                          ⚠️ Configure Client ID and Secret above to authorize
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Automation Schedule Card */}
                {backupStatus.connected && (
                  <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50/40 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">2. Automated Cloud Backups</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Define background database export frequency.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateSchedule({
                          ...backupStatus.schedule,
                          enabled: !backupStatus.schedule.enabled
                        })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          backupStatus.schedule.enabled ? "bg-teal-600" : "bg-slate-250"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            backupStatus.schedule.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {backupStatus.schedule.enabled && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-400">Daily Backup Time (24h)</span>
                            <input
                              type="time"
                              value={backupStatus.schedule.time}
                              onChange={(e) => handleUpdateSchedule({
                                ...backupStatus.schedule,
                                time: e.target.value
                              })}
                              className="rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                            />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-[240px]">
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Select Days</span>
                            <div className="flex flex-wrap gap-1.5">
                              {daysOfWeek.map((day) => {
                                const selected = backupStatus.schedule.days.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                      const nextDays = selected
                                        ? backupStatus.schedule.days.filter((d) => d !== day)
                                        : [...backupStatus.schedule.days, day];
                                      handleUpdateSchedule({
                                        ...backupStatus.schedule,
                                        days: nextDays
                                      });
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                                      selected
                                        ? "bg-teal-50 border-teal-200 text-teal-700"
                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Manual Actions Card */}
                {backupStatus.connected && (
                  <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50/40 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">3. Database Sync & Operations</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Perform immediate cloud backups or restore the database state.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        disabled={backupActionLoading !== null}
                        onClick={handleBackupNow}
                        className="rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-xs font-black text-white transition-all hover:shadow-lg disabled:opacity-50 shrink-0"
                      >
                        {backupActionLoading === "backup" ? "Backing up..." : "Backup Now"}
                      </button>

                      <button
                        type="button"
                        disabled={backupActionLoading !== null}
                        onClick={handleRestoreNow}
                        className="rounded-xl bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2.5 text-xs font-black text-red-650 transition-all disabled:opacity-50 shrink-0"
                      >
                        {backupActionLoading === "restore" ? "Restoring..." : "Restore Last Backup"}
                      </button>
                    </div>

                    <div className="p-4 border border-rose-150 rounded-2xl bg-rose-50/45 text-rose-800 text-[10px] leading-relaxed">
                      <strong>⚠️ CRITICAL DANGER ZONE ALERT:</strong> Restoring the database drops all existing tables and reloads them with data from your latest Google Drive backup. Active user sessions, pending bookings, and message history will be replaced. Ensure no critical operations are live before triggering restore.
                    </div>
                  </div>
                )}

                {/* 4. Backup History & Logs */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Activity Logs</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Historical records of automated schedules and manual triggers.</p>
                  </div>

                  {backupStatus.logs.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs">
                      No backup activities logged yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-250 text-slate-400 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-3">Time</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Size (KB)</th>
                            <th className="p-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {backupStatus.logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-[10px] text-slate-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-3 capitalize">{log.type}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  log.status === "success" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-slate-500">
                                {log.size_kb ? `${log.size_kb} KB` : "-"}
                              </td>
                              <td className="p-3 text-[10px] font-medium text-slate-500 leading-normal max-w-xs truncate" title={log.message}>
                                {log.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 py-16 justify-center">
              <span className="h-4 w-4 rounded-full bg-teal-500 glow-active shadow-[0_0_12px_rgba(20,184,166,0.4)] animate-pulse" />
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing settings from DB...</p>
            </div>
          ) : !groupedSettings[activeTab] || groupedSettings[activeTab].length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-bold text-xs">
              No configuration variables found in this tab.
            </div>
          ) : (
            <div className="space-y-6">
              {groupedSettings[activeTab].map((setting) => {
                const isBool = setting.setting_type === "boolean";
                const isJson = setting.setting_type === "json";
                const isSaving = savingId === setting.id;
                
                return (
                  <div
                    key={setting.id}
                    className="p-5 border border-slate-150 rounded-2xl bg-slate-50/30 hover:bg-white hover:border-teal-500/10 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    {/* Settings Meta & Description */}
                    <div className="space-y-1 flex-1 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                          {setting.key.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Type: {setting.setting_type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 leading-snug">{setting.description}</p>
                      {setting.meta?.help_text && (
                        <p className="text-[10px] font-semibold text-slate-400">{setting.meta.help_text}</p>
                      )}
                    </div>

                    {/* Settings Form control input */}
                    <div className="shrink-0 flex items-center gap-3">
                      {isBool ? (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleToggle(setting.id, setting.value, setting.active)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              setting.value === "true" ? "bg-teal-600" : "bg-slate-250"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                setting.value === "true" ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      ) : isJson ? (
                        <div className="flex flex-col gap-2 w-72">
                          <textarea
                            value={localValues[setting.id] ?? ""}
                            rows={3}
                            disabled={isSaving}
                            onChange={(e) => setLocalValues((prev) => ({ ...prev, [setting.id]: e.target.value }))}
                            className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500/40 font-mono shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                          />
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => saveSetting(setting.id, localValues[setting.id] ?? "")}
                            className="rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-teal-700 transition-all self-end active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {isSaving ? "Saving JSON..." : "Update JSON"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={localValues[setting.id] ?? ""}
                            disabled={isSaving}
                            onChange={(e) => setLocalValues((prev) => ({ ...prev, [setting.id]: e.target.value }))}
                            className="w-48 sm:w-60 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                          />
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => saveSetting(setting.id, localValues[setting.id] ?? "")}
                            className="rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-teal-750 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      )}

                      {/* Active variable Switch */}
                      <div className="border-l border-slate-200 pl-3 flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Index</span>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleActiveToggle(setting.id, setting.value, setting.active)}
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                            setting.active ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-transparent"
                          }`}
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Sliding Information Guide Drawer */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col justify-between animate-slide-in-right overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900">{SETTINGS_INFO.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Settings OS Help</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="font-extrabold text-slate-800 text-xs">Section Purpose</p>
                  <p className="mt-1 text-slate-500 font-semibold">{SETTINGS_INFO.description}</p>
                </div>

                <div className="space-y-3">
                  <p className="font-extrabold text-slate-850">Control Groups & Details</p>
                  <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 bg-white">
                    {SETTINGS_INFO.sections.map((sec) => (
                      <div key={sec.title} className="p-4 space-y-1">
                        <p className="font-extrabold text-slate-800">{sec.title}</p>
                        <p className="text-slate-500 font-semibold">{sec.desc}</p>
                        {sec.image_recommendation !== "None." && (
                          <p className="text-[10px] text-teal-650 font-bold mt-1">Image Size Guideline: {sec.image_recommendation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-8 w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800 cursor-pointer text-center"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
