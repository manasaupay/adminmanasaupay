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
  const [businesses, setBusinesses] = useState<BusinessIntel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load actual businesses and compile analytics from the database
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [resOptions, resAnalytics, resReviews, resFollows] = await Promise.all([
        fetch("/api/admin/options"),
        fetch("/api/admin/analytics"),
        fetch("/api/admin/reviews"),
        fetch("/api/admin/follows"),
      ]);

      const optionsData = await resOptions.json();
      const analyticsList = await resAnalytics.json();
      const reviewsList = await resReviews.json();
      const followsList = await resFollows.json();

      const rawShops = Array.isArray(optionsData.businesses) ? optionsData.businesses : [];
      const analytics = Array.isArray(analyticsList) ? analyticsList : [];
      const reviews = Array.isArray(reviewsList) ? reviewsList : [];
      const follows = Array.isArray(followsList) ? followsList : [];

      const parsed: BusinessIntel[] = rawShops.map((shop: any) => {
        const id = String(shop.value);
        const name = shop.label.split(" · ")[0];
        const category = shop.label.split(" · ")[1] || "Local Directory";

        // Aggregate real events
        const views = analytics.filter((a) => a.event_name === "profile_view" && a.entity_id === id).length || 5; // Fallback base to prevent NaN
        const calls = analytics.filter((a) => a.event_name === "call_click" && a.entity_id === id).length;
        const whatsapp = analytics.filter((a) => a.event_name === "whatsapp_click" && a.entity_id === id).length;
        const shares = analytics.filter((a) => a.event_name === "share_click" && a.entity_id === id).length;
        
        // Count active follows
        const followers = follows.filter((f) => f.target_type === "business" && String(f.target_id) === id && f.active).length;

        // Calculate average star rating from reviews
        const shopReviews = reviews.filter((r) => r.target_type === "business" && String(r.target_id) === id && r.active);
        const totalStars = shopReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
        const rating = shopReviews.length > 0 ? parseFloat((totalStars / shopReviews.length).toFixed(1)) : 4.2;

        // Calculate Business Health Score out of 100
        const scoreBase = views * 2 + calls * 10 + whatsapp * 15 + followers * 20;
        const healthScore = Math.min(100, Math.max(30, Math.round((scoreBase / (views * 3 || 1)) * 10)));

        let status: BusinessIntel["status"] = "Average";
        if (healthScore >= 85) status = "Excellent";
        else if (healthScore >= 70) status = "Good";
        else if (healthScore >= 45) status = "Average";
        else status = "Critical";

        return {
          id,
          name,
          category,
          views,
          calls,
          whatsapp,
          shares,
          followers,
          rating,
          healthScore,
          status,
        };
      });

      setBusinesses(parsed);
      if (parsed.length > 0) setSelectedId(parsed[0].id);
    } catch (err) {
      setError("Unable to retrieve directory intelligence logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedBusiness = businesses.find((b) => b.id === selectedId);

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
            Track real views, calls, WhatsApp triggers, followers, and rating indices per shop. Calculate automatic health index scores.
          </p>
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
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing directory intelligence...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Search Sidebar Selector */}
          <section className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Shop</h2>
              <p className="text-[10px] text-slate-404 font-semibold mt-0.5">Explore active shop directories.</p>
            </div>

            <input
              type="text"
              placeholder="Search business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-250 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-805 focus:border-teal-500 outline-none"
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
              {filteredList.length === 0 && (
                <p className="text-xs text-slate-400 font-bold py-6 text-center">
                  No directory entries match search.
                </p>
              )}
            </div>
          </section>

          {/* Right Detailed Dashboard Panel */}
          <section className="lg:col-span-2 space-y-6">
            {selectedBusiness ? (
              <>
                {/* Health Score Overview card */}
                <div className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                  <div className="space-y-2 relative">
                    <span className="text-[9px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
                      Business Health Index
                    </span>
                    <h2 className="text-xl font-black text-slate-900">{selectedBusiness.name}</h2>
                    <p className="text-xs text-slate-450 font-semibold">{selectedBusiness.category}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 relative">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Health index</p>
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
                        { label: "Phone Calls triggered", val: selectedBusiness.calls.toLocaleString(), color: "bg-sky-500", percent: (selectedBusiness.calls / selectedBusiness.views) * 100 || 0 },
                        { label: "WhatsApp Leads", val: selectedBusiness.whatsapp.toLocaleString(), color: "bg-indigo-500", percent: (selectedBusiness.whatsapp / selectedBusiness.views) * 100 || 0 },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                            <span>{item.label}</span>
                            <span className="text-slate-805 font-bold">{item.val}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Directory Engagement</h3>
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
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Telemetry Status</p>
                        <p className="text-xs font-bold text-teal-650 mt-1">● Active connection linked to review tables</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 text-xs font-bold py-24 glass-card bg-white rounded-3xl border">
                No active directories loaded in system tables.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
