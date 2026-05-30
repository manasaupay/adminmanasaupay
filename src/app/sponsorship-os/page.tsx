"use client";

import React, { useState } from "react";

type SponsoredEntity = {
  id: string;
  name: string;
  type: "business" | "service" | "property" | "resale" | "event";
  priority: number;
  start_date: string;
  end_date: string;
  placement: "homepage" | "category" | "search" | "offers";
  category_visibility: string;
};

export default function SponsorshipOsPage() {
  const [entities, setEntities] = useState<SponsoredEntity[]>([
    { id: "1", name: "Verma Sweets & Bakery", type: "business", priority: 9, start_date: "2026-05-01", end_date: "2026-06-01", placement: "homepage", category_visibility: "Food & Restaurant" },
    { id: "2", name: "AC Repair Guru (Partner)", type: "service", priority: 8, start_date: "2026-05-10", end_date: "2026-06-10", placement: "category", category_visibility: "AC repair" },
    { id: "3", name: "Standard 3BHK Rental Flat", type: "property", priority: 6, start_date: "2026-05-15", end_date: "2026-06-15", placement: "search", category_visibility: "Rentals" },
    { id: "4", name: "Hyperlocal Food Festival", type: "event", priority: 10, start_date: "2026-05-20", end_date: "2026-05-25", placement: "homepage", category_visibility: "global" },
  ]);

  const [form, setForm] = useState({
    name: "",
    type: "business",
    priority: 5,
    placement: "homepage",
    category_visibility: "global",
    start_date: "",
    end_date: "",
  });

  const [sponsorshipSuccess, setSponsorshipSuccess] = useState(false);

  const handleCreateSponsorship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const newSponsor: SponsoredEntity = {
      id: (entities.length + 1).toString(),
      name: form.name,
      type: form.type as any,
      priority: Number(form.priority),
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
      end_date: form.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      placement: form.placement as any,
      category_visibility: form.category_visibility,
    };

    setEntities((prev) => [newSponsor, ...prev]);
    setForm({ name: "", type: "business", priority: 5, placement: "homepage", category_visibility: "global", start_date: "", end_date: "" });
    setSponsorshipSuccess(true);
    setTimeout(() => setSponsorshipSuccess(false), 3000);
  };

  const updatePriority = (id: string, priority: number) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, priority } : e))
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Sponsorship OS</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Boost directory entities using granular priority scores. Boosted shops, services, and events show on top.
          </p>
        </div>
      </div>

      {sponsorshipSuccess && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Sponsorship activated! Priority listings pushed to the top indexing layer immediately.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Boosted Entities */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Active Boosted Listings</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Boosted items ordered by priority index score (0-10).</p>
          </div>

          <div className="space-y-3.5">
            {entities.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-slate-150 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-slate-900">{item.name}</p>
                    <span className="text-[8px] font-black uppercase text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-150">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Target: {item.placement} ({item.category_visibility})
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">
                    Duration: {item.start_date} &rarr; {item.end_date}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Priority Score</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={item.priority}
                        onChange={(e) => updatePriority(item.id, Number(e.target.value))}
                        className="h-1.5 w-24 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                      <span className="text-xs font-black text-slate-800 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Boost Entity Form */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Boost New Listing</h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
              Select any directory entry to elevate its priority indexing score.
            </p>
          </div>

          <form onSubmit={handleCreateSponsorship} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Entity Title</label>
              <input
                type="text"
                required
                placeholder="Shop or service name..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="grid gap-2 grid-cols-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="business">Shop / Business</option>
                  <option value="service">Local Service</option>
                  <option value="property">Property Listing</option>
                  <option value="event">Town Event</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Boost Target</label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="homepage">Homepage</option>
                  <option value="category">Category Page</option>
                  <option value="search">Search Page</option>
                  <option value="offers">Deals page</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-2">
              <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-400">Target Category (e.g. Sweets, AC Repair)</label>
                <input
                  type="text"
                  placeholder="e.g. food, electrician, global"
                  value={form.category_visibility}
                  onChange={(e) => setForm({ ...form, category_visibility: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid gap-2 grid-cols-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Start</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Expiry</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Priority Score Index (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-1"
            >
              🚀 Elevate Entity Priority Index
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
