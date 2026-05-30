"use client";

import React, { useState } from "react";
import Link from "next/link";

type UserSegment = {
  name: string;
  count: number;
  description: string;
  color: string;
  percentage: number;
};

export default function UserIntelligencePage() {
  const [segments, setSegments] = useState<UserSegment[]>([
    { name: "Power Users (Hyper-Active)", count: 2840, percentage: 33, color: "bg-teal-500", description: "Opened app 15+ times this month. High conversion rate." },
    { name: "New Registrations (Vetted)", count: 1890, percentage: 22, color: "bg-sky-500", description: "Signed up in last 14 days. Active explorers." },
    { name: "Casual Browse (Medium-Active)", count: 2420, percentage: 28, color: "bg-indigo-500", description: "Opened app 3-10 times. Interacts with ads." },
    { name: "Inactive / Churn Risk", count: 1450, percentage: 17, color: "bg-red-500", description: "0 sessions in last 30 days. Needs notification trigger." },
  ]);

  // Visualizing standard cohort grid values (e.g. weekly cohort retention %)
  const cohorts = [
    { cohort: "May 01 (Week 1)", size: 840, w1: "100%", w2: "78%", w3: "64%", w4: "58%", w5: "54%" },
    { cohort: "May 08 (Week 2)", size: 790, w1: "100%", w2: "82%", w3: "71%", w4: "66%", w5: "" },
    { cohort: "May 15 (Week 3)", size: 910, w1: "100%", w2: "85%", w3: "74%", w4: "", w5: "" },
    { cohort: "May 22 (Week 4)", size: 680, w1: "100%", w2: "79%", w3: "", w4: "", w5: "" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">User Intelligence Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track user segments, monitor weekly cohort retention rates, and assess churn alarm indexes to plan push alerts.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Segments Overview */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Audience Segmentation Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Active audience categorization based on monthly session frequencies.</p>
          </div>

          <div className="space-y-4">
            {segments.map((seg) => (
              <div key={seg.name} className="space-y-1.5 p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black text-slate-800">{seg.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-2">({seg.count.toLocaleString()} installs)</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{seg.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${seg.color} rounded-full`} style={{ width: `${seg.percentage}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{seg.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Churn Alarm index widget */}
        <section className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Churn Risk Alert</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Currently <strong>1,450 users (17%)</strong> are classified as inactive churn risk. You can automatically queue an offer notification campaign targetting this segment to re-engage them.
            </p>
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-red-650 uppercase">Churn Alarm index</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">Medium Risk Indicator</p>
              </div>
              <span className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
            </div>
            <Link
              href="/notification-os?target=churn"
              className="w-full inline-flex justify-center items-center rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md"
            >
              🚀 Launch Re-Engagement Blast
            </Link>
          </div>
        </section>
      </div>

      {/* Retention Cohorts Grid */}
      <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-900">Weekly Cohort Retention Analysis</h2>
          <p className="text-xs text-slate-550 mt-0.5 font-semibold">Cohort tracking represented by % users returning in subsequent weeks.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
              <tr>
                <th className="px-5 py-4 text-left">Cohort Sign-up Week</th>
                <th className="px-5 py-4">Cohort Size</th>
                <th className="px-5 py-4">Week 1</th>
                <th className="px-5 py-4">Week 2</th>
                <th className="px-5 py-4">Week 3</th>
                <th className="px-5 py-4">Week 4</th>
                <th className="px-5 py-4">Week 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {cohorts.map((row) => (
                <tr key={row.cohort} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-left font-bold text-slate-900">{row.cohort}</td>
                  <td className="px-5 py-3 text-slate-450">{row.size} installs</td>
                  <td className="px-5 py-3 bg-teal-500/20 text-teal-850 border border-white">{row.w1}</td>
                  <td className="px-5 py-3 bg-teal-500/15 text-teal-800 border border-white">{row.w2 || "—"}</td>
                  <td className="px-5 py-3 bg-teal-500/10 text-teal-700 border border-white">{row.w3 || "—"}</td>
                  <td className="px-5 py-3 bg-teal-500/5 text-teal-650 border border-white">{row.w4 || "—"}</td>
                  <td className="px-5 py-3 bg-teal-500/0 text-slate-400 border border-white">{row.w5 || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
