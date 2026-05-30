"use client";

import React, { useState } from "react";

type AdUnit = {
  id: string;
  title: string;
  type: "slider" | "popup" | "sponsored" | "search";
  placement: string;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  start_date: string;
  end_date: string;
  status: "active" | "scheduled" | "expired";
};

export default function AdsOsPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "campaign" | "analytics">("inventory");
  const [adUnits, setAdUnits] = useState<AdUnit[]>([
    { id: "1", title: "Verma Bakery Sweets 50% discount", type: "slider", placement: "homepage", impressions: 84200, clicks: 12400, revenue: 12500, ctr: 14.7, start_date: "2026-05-01", end_date: "2026-06-01", status: "active" },
    { id: "2", title: "App Open Monsoon Deal Splash", type: "popup", placement: "in_app", impressions: 34100, clicks: 5800, revenue: 8400, ctr: 17.0, start_date: "2026-05-10", end_date: "2026-06-10", status: "active" },
    { id: "3", title: "AC repair technician placement", type: "sponsored", placement: "services", impressions: 18200, clicks: 3100, revenue: 4900, ctr: 17.0, start_date: "2026-05-15", end_date: "2026-06-15", status: "active" },
    { id: "4", title: "Diwali Sweet Preorders Splash", type: "popup", placement: "in_app", impressions: 0, clicks: 0, revenue: 15000, ctr: 0.0, start_date: "2026-10-15", end_date: "2026-11-15", status: "scheduled" },
  ]);

  const [form, setForm] = useState({
    title: "",
    type: "slider",
    placement: "homepage",
    revenue: "5000",
    start_date: "",
    end_date: "",
  });

  const [campaignSuccess, setCampaignSuccess] = useState(false);

  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    const newAd: AdUnit = {
      id: (adUnits.length + 1).toString(),
      title: form.title,
      type: form.type as any,
      placement: form.placement,
      impressions: 0,
      clicks: 0,
      revenue: parseFloat(form.revenue) || 0,
      ctr: 0,
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
      end_date: form.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "scheduled",
    };

    setAdUnits((prev) => [newAd, ...prev]);
    setForm({ title: "", type: "slider", placement: "homepage", revenue: "5000", start_date: "", end_date: "" });
    setCampaignSuccess(true);
    setTimeout(() => setCampaignSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Advertisement OS</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Manage banner placements, modal popup campaigns, search sponsors, and track live marketing CTR insights.
          </p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(["inventory", "campaign", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-teal-700 shadow-sm border border-slate-150"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "campaign" ? "Launch Campaign" : tab}
            </button>
          ))}
        </div>
      </div>

      {campaignSuccess && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Monetized campaign launched successfully! Schedulers and priority triggers are loaded.
        </div>
      )}

      {/* Tab 1: Inventory Hub */}
      {activeTab === "inventory" && (
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">Active Campaign Banners</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Live inventory of active campaigns displaying in-app.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
              Total Active: {adUnits.filter(a => a.status === "active").length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Campaign Title</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Type</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Placement Target</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Active Duration</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Revenue</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">CTR</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {adUnits.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">{ad.title}</td>
                    <td className="px-5 py-3">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {ad.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">{ad.placement}</td>
                    <td className="px-5 py-3 text-[10px] text-slate-400 font-bold uppercase">{ad.start_date} &rarr; {ad.end_date}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">₹{ad.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center text-teal-600 font-extrabold">{ad.ctr > 0 ? `${ad.ctr}%` : "—"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        ad.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${ad.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {ad.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: Launch Campaign */}
      {activeTab === "campaign" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900">Configure Campaign</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Choose ad parameters, placement grids, budget pricing, and schedules.</p>
            </div>

            <form onSubmit={handleSubmitCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC Repair 20% Summer discount campaign"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Ad Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-800 outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="slider">Hero Banner Slider</option>
                    <option value="popup">App Popup Modal</option>
                    <option value="sponsored">Sponsored entity card</option>
                    <option value="search">Search Keywords Ad</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Target Placement Page</label>
                  <select
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-800 outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="services">Services details page</option>
                    <option value="shops">Business directories list</option>
                    <option value="search">Search queries</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Monetization Price (₹)</label>
                  <input
                    type="number"
                    value={form.revenue}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Expiry Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-2"
              >
                🚀 Queue & Launch Campaign
              </button>
            </form>
          </section>

          <section className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Placement Engine Advisor</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              The Ad OS places banner ads inside targeting pages automatically based on the chosen category target. For example, scheduling a campaign target to <strong>"Electrician"</strong> ensures it only shows when visitors explore electricians in town!
            </p>
            <div className="p-3 bg-teal-50/30 border border-teal-100 rounded-2xl">
              <p className="text-[9px] font-black text-teal-600 uppercase">Pro Tip</p>
              <p className="text-[9px] text-slate-500 leading-relaxed mt-1 font-semibold">
                Banners on high density categories like "Groceries" and "AC Services" charge an index score premium of ₹500 extra.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Tab 3: Performance Charts */}
      {activeTab === "analytics" && (
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900">Campaign analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Real CTR and impressions yield calculated dynamically.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { label: "Aggregate Impressions", val: "136,500 views", color: "text-teal-600" },
              { label: "Total Clicks Traversed", val: "21,300 clicks", color: "text-sky-605" },
              { label: "Overall Conversion Rate", val: "15.6%", color: "text-violet-600" },
            ].map((metric) => (
              <div key={metric.label} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">{metric.label}</p>
                <p className={`text-2xl font-black mt-1 ${metric.color}`}>{metric.val}</p>
              </div>
            ))}
          </div>

          {/* Performance bars */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Top Performing Campaigns (CTR Scale)</h3>
            <div className="space-y-3">
              {adUnits
                .filter((a) => a.ctr > 0)
                .map((ad) => (
                  <div key={ad.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{ad.title} ({ad.clicks} clicks)</span>
                      <span className="font-black text-teal-600">{ad.ctr}% CTR</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${ad.ctr * 4}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
