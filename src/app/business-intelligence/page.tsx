"use client";

import React, { useEffect, useState } from "react";

type BusinessIntel = {
  id: string;
  name: string;
  category: string;
  views: number;
  calls: number;
  whatsapp: number;
  shares: number;
  followers: number;
  rating: number;
  healthScore: number;
  status: "Excellent" | "Good" | "Average" | "Critical";
};

export default function BusinessIntelligencePage() {
  const [businesses, setBusinesses] = useState<BusinessIntel[]>([
    { id: "1", name: "Verma Sweets & Bakery", category: "Food & Sweet Parlor", views: 4820, calls: 940, whatsapp: 1240, shares: 340, followers: 820, rating: 4.8, healthScore: 96, status: "Excellent" },
    { id: "2", name: "AC Repair Guru (Partner)", category: "Local Services", views: 2840, calls: 510, whatsapp: 890, shares: 120, followers: 310, rating: 4.6, healthScore: 92, status: "Excellent" },
    { id: "3", name: "Sharma Kirana & General Store", category: "Groceries", views: 1890, calls: 140, whatsapp: 340, shares: 60, followers: 180, rating: 4.1, healthScore: 78, status: "Good" },
    { id: "4", name: "Chaudhary Electronics", category: "Retail Store", views: 640, calls: 40, whatsapp: 90, shares: 15, followers: 45, rating: 3.5, healthScore: 54, status: "Average" },
    { id: "5", name: "Pooja Boutique", category: "Fashion & Lifestyle", views: 210, calls: 5, whatsapp: 10, shares: 2, followers: 8, rating: 2.8, healthScore: 28, status: "Critical" },
  ]);

  const [selectedId, setSelectedId] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedBusiness = businesses.find((b) => b.id === selectedId) || businesses[0];

  // Dynamic filter for search dropdown
  const filteredList = businesses.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Business Intelligence Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Track views, calls, WhatsApp triggers, followers, and rating indices per shop. Calculate automatic health index scores.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Search Sidebar Selector */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Shop</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Explore active shop directories.</p>
          </div>

          <input
            type="text"
            placeholder="Search business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-250 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
          />

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredList.map((shop) => (
              <button
                key={shop.id}
                type="button"
                onClick={() => setSelectedId(shop.id)}
                className={`w-full text-left p-3 border rounded-2xl transition-all cursor-pointer ${
                  selectedId === shop.id
                    ? "bg-teal-50/50 border-teal-500/30 text-teal-900 shadow-sm"
                    : "bg-white border-slate-150 hover:bg-slate-50/50"
                }`}
              >
                <p className="text-xs font-black">{shop.name}</p>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{shop.category}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    shop.status === "Excellent" ? "bg-emerald-50 text-emerald-700" :
                    shop.status === "Good" ? "bg-teal-50 text-teal-700" :
                    shop.status === "Average" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {shop.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Detailed Dashboard Panel */}
        <section className="lg:col-span-2 space-y-6">
          {/* Health Score Overview card */}
          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="space-y-2 relative">
              <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
                Business Health Index
              </span>
              <h2 className="text-xl font-black text-slate-900">{selectedBusiness.name}</h2>
              <p className="text-xs text-slate-450 font-semibold">{selectedBusiness.category} Directory Entry</p>
            </div>

            <div className="flex items-center gap-4 shrink-0 relative">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Index Rating</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight mt-1">{selectedBusiness.healthScore}%</p>
              </div>
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border ${
                selectedBusiness.status === "Excellent" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                selectedBusiness.status === "Good" ? "bg-teal-50 text-teal-600 border-teal-100" :
                selectedBusiness.status === "Average" ? "bg-amber-50 text-amber-600 border-amber-100" :
                "bg-red-50 text-red-650 border-red-100"
              }`}>
                <span className="text-2xl font-black">{selectedBusiness.rating}</span>
              </div>
            </div>
          </div>

          {/* Business Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Conversion Triggers</h3>
              <div className="space-y-3.5">
                {[
                  { label: "Profile Views", val: selectedBusiness.views.toLocaleString(), color: "bg-teal-500", percent: 100 },
                  { label: "Phone Calls triggered", val: selectedBusiness.calls.toLocaleString(), color: "bg-sky-500", percent: (selectedBusiness.calls / selectedBusiness.views) * 100 },
                  { label: "WhatsApp Leads", val: selectedBusiness.whatsapp.toLocaleString(), color: "bg-indigo-500", percent: (selectedBusiness.whatsapp / selectedBusiness.views) * 100 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>{item.label}</span>
                      <span className="text-slate-800 font-bold">{item.val}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Directory engagement</h3>
              <div className="grid gap-4 grid-cols-2">
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">App Shares</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{selectedBusiness.shares}</p>
                </div>
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">App Followers</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{selectedBusiness.followers}</p>
                </div>
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 text-center col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Rating Index Trend</p>
                  <p className="text-lg font-black text-teal-650 mt-1">▲ Steady growth (+8% YoY)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
