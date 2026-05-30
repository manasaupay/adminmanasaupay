"use client";

import React, { useState } from "react";

type ErrorLog = {
  id: string;
  source: "API" | "Database" | "FCM" | "Auth" | "Upload";
  message: string;
  time: string;
  severity: "high" | "medium" | "low";
};

export default function MonitoringCenterPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([
    { id: "1", source: "Database", message: "Transaction lock timeout on public.resale indices during peak hours", time: "10:42 AM", severity: "medium" },
    { id: "2", source: "FCM", message: "Multicast chunk reject for token range ending in '_41ab': unregistered device", time: "10:35 AM", severity: "low" },
    { id: "3", source: "Auth", message: "OTP validation threshold breached for user email support@sharma.com", time: "10:12 AM", severity: "high" },
    { id: "4", source: "API", message: "504 gateway timeout fetching /api/admin/reviews from backend node", time: "09:45 AM", severity: "medium" },
  ]);

  const [alertsActive, setAlertsActive] = useState(true);

  const stats = [
    { label: "API Success Index", value: "99.8%", color: "text-teal-600" },
    { label: "Database Response", value: "42ms", color: "text-sky-600" },
    { label: "FCM Broadcast yield", value: "99.4%", color: "text-violet-605" },
    { label: "Authentication health", value: "98.7%", color: "text-indigo-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Monitoring Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track database latencies, API timeout rates, FCM push failures, OTP login thresholds, and media storage upload health.
          </p>
        </div>
      </div>

      {/* Global Metrics Row */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Live Health Metres</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="p-5 border border-slate-150 bg-white rounded-2xl shadow-sm text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-450">{item.label}</p>
              <p className={`text-2xl font-black mt-1 ${item.color}`}>{item.value}</p>
              <span className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mt-1 block">▲ Excellent state</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Error Tracing Console */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">Active Error Traces</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">System logs recorded across backend and Supabase nodes.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
              Traced Alerts: {logs.length}
            </span>
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border border-slate-150 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      log.severity === "high" ? "bg-red-500 animate-ping" :
                      log.severity === "medium" ? "bg-amber-500" :
                      "bg-slate-400"
                    }`} />
                    <span className="text-xs font-black text-slate-900">[{log.source}] Error</span>
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                      log.severity === "high" ? "bg-red-50 text-red-700" :
                      log.severity === "medium" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-650"
                    }`}>
                      {log.severity} severity
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{log.message}</p>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts Config Side-Widget */}
        <section className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Alert Threshold Config</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                Configure immediate push notification rules when performance indexes exceed margins.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <div>
                  <span className="text-xs font-bold text-slate-800">Database Latency Alert</span>
                  <span className="text-[8px] text-slate-400 font-bold block">Notify when latency exceeds 200ms</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4.5 w-4.5 rounded border-slate-350 text-teal-605 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <div>
                  <span className="text-xs font-bold text-slate-800">FCM Failure Rate Alarm</span>
                  <span className="text-[8px] text-slate-400 font-bold block">Notify when broadcast fails exceed 5%</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4.5 w-4.5 rounded border-slate-350 text-teal-605 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <div>
                  <span className="text-xs font-bold text-slate-800">Auth Breaches Shield</span>
                  <span className="text-[8px] text-slate-400 font-bold block">Fires alarm on 5 consecutive OTP rejects</span>
                </div>
                <input
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-350 text-teal-605 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setAlertsActive(!alertsActive);
                alert(`Platform Operations Alert Shield toggled: ${!alertsActive ? "ENABLED" : "MUTED"}`);
              }}
              className={`w-full rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                alertsActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-white text-slate-500 border-slate-250 hover:bg-slate-50"
              }`}
            >
              {alertsActive ? "🔔 Monitoring Alert Shield Active" : "🔕 Mute Alert Notifications"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
