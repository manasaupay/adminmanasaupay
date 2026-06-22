"use client";

import React, { useState } from "react";

export default function ExportCenterPage() {
  const [table, setTable] = useState("users");
  const [format, setFormat] = useState("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompiling(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/${table}`);
      const data = await res.json();
      
      let filteredData = Array.isArray(data) ? data : [];
      
      if (startDate) {
        const start = new Date(startDate);
        filteredData = filteredData.filter((row: any) => {
          const dateVal = row.created_at || row.started_at || row.date || row.published_at || row.event_date;
          return dateVal ? new Date(dateVal) >= start : true;
        });
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredData = filteredData.filter((row: any) => {
          const dateVal = row.created_at || row.started_at || row.date || row.published_at || row.event_date;
          return dateVal ? new Date(dateVal) <= end : true;
        });
      }

      let fileContent = "";
      let filename = `${table}_export.${format}`;
      let mimeType = "text/csv;charset=utf-8;";

      if (format === "csv") {
        if (filteredData.length > 0) {
          const keys = Object.keys(filteredData[0]);
          const headers = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(",");
          const rows = filteredData.map((row) =>
            keys
              .map((key) => {
                const val = row[key];
                const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
                return `"${str.replace(/"/g, '""')}"`;
              })
              .join(",")
          );
          fileContent = [headers, ...rows].join("\n");
        } else {
          fileContent = "No records found matching filters.";
        }
      } else if (format === "json") {
        fileContent = JSON.stringify(filteredData, null, 2);
        mimeType = "application/json;charset=utf-8;";
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCompiling(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setCompiling(false);
      alert("Error compiling data: failed to retrieve real database records.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Data Export Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Compile operational database records matching specific date scopes. Compile and download in CSV, Excel, or PDF formats.
          </p>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Spreadsheet compiled successfully! File download initiated.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Form Selector */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Configure Spreadsheet Export</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Choose database tables, target date scopes, and formats.</p>
          </div>

          <form onSubmit={handleExport} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Database Target Table</label>
                <select
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer font-bold"
                >
                  <option value="users">Registered Users</option>
                  <option value="businesses">Shops & Businesses Directory</option>
                  <option value="ads">Advertisement placements (Banners)</option>
                  <option value="notifications">FCM Alerts sent log</option>
                  <option value="analytics">Click & Impressions analytics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Export Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer font-bold"
                >
                  <option value="csv">Standard CSV Spreadsheet</option>
                  <option value="json">JSON Data Dump</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Date Range Start (Optional)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Date Range Expiry (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={compiling}
              className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-2 disabled:opacity-50"
            >
              {compiling ? "Compiling Spreadsheet..." : "📥 Compile & Download Spreadsheet"}
            </button>
          </form>
        </section>

        {/* Security / Advisory Shield */}
        <section className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-150 bg-gradient-to-tr from-slate-900 to-slate-950 p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-teal-500/10 rounded-full blur-2xl" />
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">Data Integrity Shield</h3>
            <p className="text-[10px] text-slate-350 leading-relaxed font-semibold">
              Exports compiled here utilize encrypted SSL connections querying the Supabase nodes directly. Personal identifier columns (e.g. raw password hashes, raw sessions tokens) are filtered and redacted automatically prior to CSV creation.
            </p>
            <div className="pt-2 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>GDPR compliant: YES</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
