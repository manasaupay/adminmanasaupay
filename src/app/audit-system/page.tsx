"use client";

import React, { useState } from "react";

type AuditRecord = {
  id: string;
  admin: string;
  action: string;
  table: string;
  target_id: string;
  time: string;
  ip: string;
  device: string;
  old_value: string;
  new_value: string;
};

export default function AuditSystemPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([
    { id: "101", admin: "manasaupay@gmail.com (Super Admin)", action: "UPDATE_STATUS", table: "businesses", target_id: "8c94-f2a1", time: "2026-05-30 10:30:12", ip: "192.168.1.1", device: "Chrome / Windows 11", old_value: '{"is_approved": false, "priority": 0}', new_value: '{"is_approved": true, "priority": 5}' },
    { id: "102", admin: "manasaupay@gmail.com (Super Admin)", action: "CREATE_CAMPAIGN", table: "ads", target_id: "721a-e982", time: "2026-05-30 09:15:40", ip: "192.168.1.1", device: "Chrome / Windows 11", old_value: "{}", new_value: '{"type": "slider", "placement": "homepage", "revenue": 12500}' },
    { id: "103", admin: "moderator_sharma@gmail.com (Content Moderator)", action: "DELETE_LISTING", table: "resale", target_id: "542b-a482", time: "2026-05-29 18:45:00", ip: "192.168.1.4", device: "Safari / macOS", old_value: '{"id": "542b-a482", "title": "Spam iPhone Offer", "price": "15,000"}', new_value: "null" },
    { id: "104", admin: "manasaupay@gmail.com (Super Admin)", action: "UPDATE_SETTING", table: "settings", target_id: "1c28-9411", time: "2026-05-29 14:10:02", ip: "192.168.1.1", device: "Firefox / Windows 11", old_value: '{"branding_primary_color": "#0d9488"}', new_value: '{"branding_primary_color": "#14b8a6"}' },
  ]);

  const [selectedLogId, setSelectedLogId] = useState<string | null>("101");
  const [rollbackSuccess, setRollbackSuccess] = useState(false);

  const selectedLog = logs.find((l) => l.id === selectedLogId);

  const triggerRollback = (log: AuditRecord) => {
    if (confirm(`Are you sure you want to rollback action ID: #${log.id}? This will restore the database record in table: "${log.table}" back to its previous values.`)) {
      setRollbackSuccess(true);
      setTimeout(() => setRollbackSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track structural changes, view detailed IP/Device session parameters, compare JSON values, and trigger database rollbacks instantly.
          </p>
        </div>
      </div>

      {rollbackSuccess && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Restoration complete! Previous values successfully synchronized to database table state.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Logs List Table */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">Audit Trails Index</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Every action executed inside the console dashboard.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
              Logged Events: {logs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
                <tr>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Target Table</th>
                  <th className="px-5 py-4">Admin Session</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4 text-center">Restore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                      selectedLogId === log.id ? "bg-teal-50/30" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <p>{log.action}</p>
                      <span className="text-[8px] text-slate-400 font-bold uppercase block mt-0.5">ID: #{log.id}</span>
                    </td>
                    <td className="px-5 py-3.5">{log.table}</td>
                    <td className="px-5 py-3.5 text-[10px]">{log.admin.split(" ")[0]}</td>
                    <td className="px-5 py-3.5 text-[10px] text-slate-400 font-bold uppercase">{log.time}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerRollback(log);
                        }}
                        className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[9px] font-black uppercase text-teal-700 border border-teal-150 hover:bg-teal-100 active:scale-95 transition-all cursor-pointer"
                      >
                        Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* JSON Diff Inspector Panel */}
        <section className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4 h-[420px] flex flex-col justify-between">
            {selectedLog ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">JSON Diff Inspector</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Target ID: {selectedLog.target_id}</p>
                </div>

                <div className="grid gap-3 grid-cols-2 flex-1 max-h-[220px]">
                  <div className="p-3 border border-slate-150 bg-slate-50 rounded-2xl overflow-y-auto scrollbar-thin">
                    <p className="text-[8px] font-black uppercase tracking-wider text-red-500 mb-1.5">Old Value</p>
                    <pre className="text-[10px] font-mono text-slate-655 font-bold leading-normal whitespace-pre-wrap">
                      {selectedLog.old_value}
                    </pre>
                  </div>

                  <div className="p-3 border border-teal-100 bg-teal-50/10 rounded-2xl overflow-y-auto scrollbar-thin">
                    <p className="text-[8px] font-black uppercase tracking-wider text-teal-605 mb-1.5">New Value</p>
                    <pre className="text-[10px] font-mono text-slate-655 font-bold leading-normal whitespace-pre-wrap">
                      {selectedLog.new_value}
                    </pre>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold space-y-1">
                  <p><strong className="text-slate-600">IP:</strong> {selectedLog.ip}</p>
                  <p><strong className="text-slate-600">Session Device:</strong> {selectedLog.device}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs font-bold py-16 flex-1">
                Select an audit record to inspect JSON comparisons.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
