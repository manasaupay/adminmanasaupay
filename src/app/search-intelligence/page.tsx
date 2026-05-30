"use client";

import React, { useState, useEffect } from "react";

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
  const [searches, setSearches] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "failed" | "top">("all");

  // Fetch search events from analytics database table
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      const analyticsList = Array.isArray(data) ? data : [];

      // Filter search events
      const searchEvents = analyticsList.filter((a: any) => a.event_name === "search" || a.event_name === "search_fail");

      // Group search terms
      const termMap: Record<string, { volume: number; resultsCount: number; conversions: number }> = {};

      searchEvents.forEach((event: any) => {
        const meta = event.metadata ?? {};
        const query = (meta.query ?? meta.search_query ?? "Unknown").trim().toLowerCase();
        if (!query) return;

        const resultsCount = typeof meta.results_count === "number" ? meta.results_count : (event.event_name === "search_fail" ? 0 : 5);
        const conversion = event.metadata?.converted === true || event.metadata?.conversion === true ? 1 : 0;

        if (termMap[query]) {
          termMap[query].volume += 1;
          termMap[query].conversions += conversion;
          if (resultsCount === 0) termMap[query].resultsCount = 0; // Lock to 0 if a fail event exists
        } else {
          termMap[query] = {
            volume: 1,
            resultsCount,
            conversions: conversion,
          };
        }
      });

      const parsedList: SearchQuery[] = Object.entries(termMap).map(([query, value], index) => {
        const conversionRate = value.volume > 0 ? parseFloat(((value.conversions / value.volume) * 100).toFixed(1)) : 0;
        return {
          id: String(index + 1),
          query,
          volume: value.volume,
          resultsCount: value.resultsCount,
          conversions: value.conversions,
          conversionRate,
          trend: value.volume > 5 ? "up" : "stable",
        };
      });

      // Sort by volume descending
      parsedList.sort((a, b) => b.volume - a.volume);
      setSearches(parsedList);
    } catch (err) {
      setError("Unable to retrieve search metrics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredSearches = searches.filter((s) => {
    if (filterMode === "failed") return s.resultsCount === 0;
    if (filterMode === "top") return s.volume >= 5;
    return true;
  });

  const handleCreateCategory = (query: string) => {
    alert(`Category shortcut active! Preloading creator with target key: "${query.replace(/\s+/g, '_')}"`);
    window.location.href = `/categories?create_key=${encodeURIComponent(query)}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Search Intelligence Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track real user search trends, failed search terms (0 results), and conversion funnels to expand dynamic classifications instantly.
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
              {mode === "failed" ? "Failed Searches (0 Results)" : mode === "top" ? "Top Searches (5+)" : "All Queries"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm">
          <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 justify-center">
          <span className="h-4 w-4 rounded-full bg-teal-500 animate-ping shadow-[0_0_12px_rgba(20,184,166,0.4)]" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Analyzing search telemetries...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Table Grid */}
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
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
                  <tr>
                    <th className="px-5 py-4">Search Keyword</th>
                    <th className="px-5 py-4 text-center">Volume (views)</th>
                    <th className="px-5 py-4 text-center">Results Count</th>
                    <th className="px-5 py-4 text-center">CTR Conversion</th>
                    <th className="px-5 py-4 text-center">Trend</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredSearches.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        {s.query}
                        {s.resultsCount === 0 && (
                          <span className="text-[7px] font-black uppercase text-red-755 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full animate-pulse">
                            Missed Demand
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-900">{s.volume.toLocaleString()}</td>
                      <td className={`px-5 py-3.5 text-center ${s.resultsCount === 0 ? "text-red-500 font-black" : "text-slate-700"}`}>
                        {s.resultsCount}
                      </td>
                      <td className="px-5 py-3.5 text-center text-teal-605 font-black">
                        {s.resultsCount > 0 ? `${s.conversionRate}%` : "0.0%"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[8px] font-black uppercase ${
                          s.trend === "up" ? "text-emerald-650" : s.trend === "down" ? "text-red-500" : "text-slate-450"
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
                  {filteredSearches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-bold">
                        No search logs found matching the filter criteria.
                      </td>
                    </tr>
                  )}
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
                <p className="text-[9px] font-black text-red-405 uppercase">Missed Demand Summary</p>
                <p className="text-[9px] text-slate-350 leading-relaxed mt-1 font-semibold">
                  Failed searches represent pure market opportunities inside the Manasa district app.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-3.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Search Funnel Metrics</h3>
              <div className="space-y-3">
                {[
                  { label: "Search Conversions Clicks", percent: searches.length > 0 ? 68 : 0, val: "68% CTR target" },
                  { label: "Direct Phone Calls", percent: searches.length > 0 ? 45 : 0, val: "45% conversion target" },
                  { label: "WhatsApp Chat Triggers", percent: searches.length > 0 ? 38 : 0, val: "38% conversion target" },
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
      )}
    </div>
  );
}
