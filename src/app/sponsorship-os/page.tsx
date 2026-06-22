"use client";

import React, { useState, useEffect } from "react";
import { AdminInfoDrawer } from "@/components/admin-info-drawer";

type SponsoredEntity = {
  id: string;
  name: string;
  type: "business" | "service" | "property" | "resale" | "event";
  priority: number;
  start_date: string;
  end_date: string;
  placement: "homepage" | "category" | "search" | "offers" | "carousel";
  category_visibility: string;
};

export default function SponsorshipOsPage() {
  const [showInfo, setShowInfo] = useState(false);
  const [entities, setEntities] = useState<SponsoredEntity[]>([]);
  const [shops, setShops] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    business_id: "",
    priority: 5,
    placement: "homepage",
    category_key: "global",
    start_date: "",
    end_date: "",
  });

  const [sponsorshipSuccess, setSponsorshipSuccess] = useState(false);

  // Fetch real sponsored_shops list and directory options
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [resSponsors, resOptions] = await Promise.all([
        fetch("/api/admin/sponsored_shops"),
        fetch("/api/admin/options"),
      ]);

      const sponsorsData = await resSponsors.json();
      const optionsData = await resOptions.json();

      const sponsorsList = Array.isArray(sponsorsData) ? sponsorsData : [];
      const shopsList = Array.isArray(optionsData.businesses) ? optionsData.businesses : [];

      setShops(shopsList);

      const parsed: SponsoredEntity[] = sponsorsList.map((item: any) => {
        const matchingShop = shopsList.find((s: any) => s.value === String(item.business_id));
        return {
          id: String(item.id),
          name: matchingShop ? matchingShop.label.split(" · ")[0] : `Shop Ref #${String(item.business_id).slice(0, 4)}`,
          type: "business",
          priority: item.priority || 0,
          start_date: item.start_date || "—",
          end_date: item.end_date || "—",
          placement: item.placement || "homepage",
          category_visibility: item.category_key || "global",
        };
      });

      setEntities(parsed);
    } catch (err) {
      setError("Unable to sync active sponsorships.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_id) return;

    setError(null);
    setSponsorshipSuccess(false);

    try {
      const payload = {
        business_id: form.business_id,
        placement: form.placement,
        category_key: form.category_key === "global" ? null : form.category_key,
        priority: Number(form.priority),
        active: true,
        start_date: form.start_date || new Date().toISOString().slice(0, 10),
        end_date: form.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      };

      const res = await fetch("/api/admin/sponsored_shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to boost sponsored shops");

      setSponsorshipSuccess(true);
      setForm({ business_id: "", priority: 5, placement: "homepage", category_key: "global", start_date: "", end_date: "" });
      void loadData();
      setTimeout(() => setSponsorshipSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error boosting sponsorship");
    }
  };

  const updatePriority = async (id: string, priority: number) => {
    try {
      const res = await fetch("/api/admin/sponsored_shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, priority }),
      });
      if (res.ok) {
        setEntities((prev) =>
          prev.map((e) => (e.id === id ? { ...e, priority } : e))
        );
      }
    } catch {
      // Gracefully ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Sponsorship OS</h1>
            <button
              onClick={() => setShowInfo(true)}
              title="Show Sponsorship OS Guide"
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="h-5 w-5 text-teal-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Boost directory entities using real-time priority scores. Boosted shops show on top lists.
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

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 justify-center">
          <span className="h-4 w-4 rounded-full bg-teal-500 animate-ping shadow-[0_0_12px_rgba(20,184,166,0.4)]" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing live boost indexes...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Boosted Entities */}
          <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900">Active Boosted Listings</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Boosted items ordered by priority index score (0-10).</p>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
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

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="text-right">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Priority Score</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={item.priority}
                          onChange={(e) => void updatePriority(item.id, Number(e.target.value))}
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
              {entities.length === 0 && (
                <p className="text-xs font-bold text-slate-450 py-10 text-center">
                  No active boosts registered in directory databases.
                </p>
              )}
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
                <label className="text-[9px] font-black uppercase text-slate-400">Target Local Shop</label>
                <select
                  required
                  value={form.business_id}
                  onChange={(e) => setForm({ ...form, business_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer font-bold"
                >
                  <option value="">— select shop —</option>
                  {shops.map((shop) => (
                    <option key={shop.value} value={shop.value}>
                      {shop.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Target Placement</label>
                  <select
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-750 outline-none focus:border-teal-500 cursor-pointer font-bold"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="category">Category Page</option>
                    <option value="search">Search Page</option>
                    <option value="offers">Deals page</option>
                    <option value="carousel">Sliders</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Category Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. food, global"
                    value={form.category_key}
                    onChange={(e) => setForm({ ...form, category_key: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Expiry Date</label>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-1 cursor-pointer"
              >
                🚀 Boost Target Shop priority
              </button>
            </form>
          </section>
        </div>
      )}

      <AdminInfoDrawer
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Sponsorship OS"
        subtitle="Marketing OS Module"
        purpose="Configures target listings boost metrics, priority scores, and campaigns timelines."
        sections={[
          {
            title: "Active Sponsorships List",
            desc: "Displays boosted directory entities, listing their relative sorting priority index and display channels."
          },
          {
            title: "Launch Boost Campaign",
            desc: "Select a registered shop, designate placement channels, and define priority scores (0-10) to pin listing on top."
          },
          {
            title: "Image Specifications",
            desc: "Category page sponsorship promo banners: 800 x 400 px (2:1 landscape). Carousel ads: 1000 x 500 px.",
            imageRecommendation: "800 x 400 px subcategory banner"
          }
        ]}
      />
    </div>
  );
}
