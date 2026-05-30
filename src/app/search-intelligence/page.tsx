"use client";

import React, { useState } from "react";
import Link from "next/link";

type SearchQuery = {
  id: string;
  query: string;
  volume: number;
  resultsCount: number;
  conversions: number;
  conversionRate: number;
  trend: "up" | "down" | "stable";
};

export default function SearchIntelligencePage() {
  const [searches, setSearches] = useState<SearchQuery[]>([
    { id: "1", query: "AC Service repair", volume: 1840, resultsCount: 12, conversions: 610, conversionRate: 33.1, trend: "up" },
    { id: "2", query: "Sweet shop laddu", volume: 1420, resultsCount: 6, conversions: 490, conversionRate: 34.5, trend: "up" },
    { id: "3", query: "PG Room rentals", volume: 920, resultsCount: 0, conversions: 0, conversionRate: 0.0, trend: "up" },
    { id: "4", query: "Tuition Classes 10th", volume: 640, resultsCount: 0, conversions: 0, conversionRate: 0.0, trend: "up" },
    { id: "5", query: "Plumber bathroom leak", volume: 590, resultsCount: 4, conversions: 120, conversionRate: 20.3, trend: "stable" },
    { id: "6", query: "Motorcycle second hand", volume: 480, resultsCount: 18, conversions: 90, conversionRate: 18.7, trend: "down" },
  ]);

  const [filterMode, setFilterMode] = useState<"all" | "failed" | "top">("all");

  const filteredSearches = searches.filter((s) => {
    if (filterMode === "failed") return s.resultsCount === 0;
    if (filterMode === "top") return s.volume >= 1000;
    return true;
  });

  const handleCreateCategory = (query: string) => {
    alert(`Category shortcut active! Navigating to categories OS config preloaded with key: "${query.toLowerCase().replace(/\s+/g, '_')}"`);
    window.location.href = `/categories?create_key=${encodeURIComponent(query)}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Search Intelligence Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track user search trends, failed search terms (0 results), and conversion funnels to expand dynamic classifications instantly.
          </p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(["all", "failed", "top"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === mode
                  ? "bg-white text-teal-700 shadow-sm border border-slate-150"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {mode === "failed" ? "Failed Searches (0 Results)" : mode === "top" ? "Top Searches (1K+)" : "All Queries"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">Search Query Index</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">User search keywords parsed in target range.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
              Unique Queries: {searches.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Search Keyword</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Volume (views)</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Results Count</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">CTR Conversion</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Trend</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredSearches.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      {s.query}
                      {s.resultsCount === 0 && (
                        <span className="text-[7px] font-black uppercase text-red-750 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full animate-pulse">
                          Missed Demand
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900">{s.volume.toLocaleString()}</td>
                    <td className={`px-5 py-3.5 text-center ${s.resultsCount === 0 ? "text-red-500 font-black" : "text-slate-700"}`}>
                      {s.resultsCount}
                    </td>
                    <td className="px-5 py-3.5 text-center text-teal-600 font-black">
                      {s.resultsCount > 0 ? `${s.conversionRate}%` : "0.0%"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[8px] font-black uppercase ${
                        s.trend === "up" ? "text-emerald-650" : s.trend === "down" ? "text-red-500" : "text-slate-400"
                      }`}>
                        {s.trend === "up" ? "▲ rising" : s.trend === "down" ? "▼ dropping" : "● stable"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {s.resultsCount === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleCreateCategory(s.query)}
                          className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[9px] font-black uppercase text-teal-700 border border-teal-150 hover:bg-teal-100 active:scale-95 transition-all cursor-pointer"
                        >
                          ➕ Add Category
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-bold uppercase">vetted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Failed Searches Analytics Side-Widget */}
        <section className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-150 bg-gradient-to-tr from-slate-900 to-slate-950 p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-red-500/10 rounded-full blur-2xl" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-red-400">Failed Search Warning</h3>
              <p className="text-[10px] text-slate-350 leading-relaxed font-semibold mt-1">
                Admins see missed local demands instantly. For example, when users search for **"PG Room"** and get 0 results, you can immediately create a **"PG Rentals"** category with 0 developer support to capture immediate traffic!
              </p>
            </div>
            <div className="p-3 bg-red-950/40 border border-red-900 rounded-xl">
              <p className="text-[9px] font-black text-red-400 uppercase">Current Missed Traffic</p>
              <p className="text-[9px] text-slate-400 leading-relaxed mt-1 font-semibold">
                Over 1,560 unique visitors failed to find local PG Accommodations and Classes in the last 7 days.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Search Funnel Metrics</h3>
            <div className="space-y-3">
              {[
                { label: "Search Conversions Clicks", percent: 68, val: "68% CTR" },
                { label: "Direct Phone Calls", percent: 45, val: "45% conversions" },
                { label: "WhatsApp Chat Triggers", percent: 38, val: "38% conversions" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>{item.label}</span>
                    <span className="text-slate-800 font-bold">{item.val}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
