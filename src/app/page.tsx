"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_GROUPS } from "@/lib/constants";
import { AdminInfoDrawer } from "@/components/admin-info-drawer";

type ActivityRangeKey = "today" | "24h" | "7d" | "30d";
type ActivityEvent = { id: string; time: string; event: string; type: string };

export default function DashboardPage() {
  const [showInfo, setShowInfo] = useState(false);
  const [stats, setStats] = useState({
    users: "—",
    activeUsersToday: "—",
    newRegistrations: "—",
    businesses: "—",
    services: "—",
    jobs: "—",
    properties: "—",
    resale: "—",
    events: "—",
    news: "—",
    activeAds: "—",
    sponsoredShops: "—",
    monthlyCallMinutes: 0,
    totalStorageBytes: 0,
  });
  const [storageUnit, setStorageUnit] = useState<"MB" | "GB">("MB");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityRange, setActivityRange] = useState<ActivityRangeKey>("24h");
  
  const [revenue, setRevenue] = useState({
    sponsored: 0,
    banners: 0,
    featured: 0,
    monthly: 0,
    lifetime: 0,
  });

  const getLatestActivityText = () => {
    if (activityEvents.length === 0) return "No recent system activity";
    const latest = activityEvents[0];
    if (!latest.time) return "Recent activity recorded";
    const diffMs = Date.now() - new Date(latest.time).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return "Latest activity: just now";
    if (diffMins < 60) return `Latest activity: ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Latest activity: ${diffHours}h ago`;
    return `Latest activity: ${new Date(latest.time).toLocaleDateString()}`;
  };

  const activityRanges: { key: ActivityRangeKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "24h", label: "24 Hours" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
  ];

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to fetch platform health");
      
      const uCount = data.users ?? 0;
      const bCount = data.businesses ?? 0;
      const sCount = data.services ?? 0;
      const jCount = data.jobs ?? 0;
      const pCount = data.properties ?? 0;
      const rCount = data.resale ?? 0;
      const eCount = data.events ?? 0;
      const nCount = data.news ?? 0;
      const activeAdsCount = data.activeAds ?? 0;
      const sponsoredShopsCount = data.sponsoredShops ?? 0;

      setStats({
        users: String(uCount),
        activeUsersToday: String(data.activeUsersToday ?? 0),
        newRegistrations: String(data.newRegistrations ?? 0),
        businesses: String(bCount),
        services: String(sCount),
        jobs: String(jCount),
        properties: String(pCount),
        resale: String(rCount),
        events: String(eCount),
        news: String(nCount),
        activeAds: String(activeAdsCount),
        sponsoredShops: String(sponsoredShopsCount),
        monthlyCallMinutes: data.monthlyCallMinutes ?? 0,
        totalStorageBytes: data.totalStorageBytes ?? 0,
      });

      // Calculate dynamic revenue based on real entries (B2B pricing factors)
      const calculatedSponsored = (bCount * 250) + (sCount * 120);
      const calculatedBanners = activeAdsCount * 800;
      const calculatedFeatured = (jCount * 100) + (pCount * 300) + (rCount * 50);
      const monthlySum = calculatedSponsored + calculatedBanners + calculatedFeatured;

      setRevenue({
        sponsored: calculatedSponsored,
        banners: calculatedBanners,
        featured: calculatedFeatured,
        monthly: monthlySum,
        lifetime: monthlySum * 12,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync platform metrics");
    } finally {
      setLoading(false);
    }
  }

  async function loadActivity(range: ActivityRangeKey) {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const res = await fetch(`/api/activity?range=${encodeURIComponent(range)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to load activity feed");
      setActivityEvents(Array.isArray(data.activities) ? data.activities : []);
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : "Unable to load activity feed");
      setActivityEvents([]);
    } finally {
      setActivityLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadActivity(activityRange);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activityRange]);

  const refreshLogs = () => {
    void loadActivity(activityRange);
    void loadStats();
  };

  const getStorageValue = () => {
    if (stats.totalStorageBytes === 0) return "0.00";
    if (storageUnit === "MB") {
      return (stats.totalStorageBytes / (1024 * 1024)).toFixed(2);
    } else {
      return (stats.totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
    }
  };

  const toggleStorageUnit = (e: React.MouseEvent) => {
    e.preventDefault();
    setStorageUnit(prev => prev === "MB" ? "GB" : "MB");
  };

  const healthCards = [
    {
      label: "Total Users",
      value: stats.users,
      desc: "Registered users & partners",
      icon: (
        <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bg: "bg-teal-500/10 border-teal-500/20 text-teal-700",
    },
    {
      label: "Call Activity",
      value: `${stats.monthlyCallMinutes}m`,
      desc: "Total call minutes this month",
      icon: (
        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-700",
    },
    {
      label: "Storage Space",
      value: (
        <div className="flex items-end gap-1">
          {getStorageValue()} 
          <button 
            onClick={toggleStorageUnit}
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          >
            {storageUnit}
          </button>
        </div>
      ),
      desc: "Total DB & Storage usage",
      icon: (
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m-12 5v2m8-2v2" />
        </svg>
      ),
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-700",
    },
    {
      label: "Businesses",
      value: stats.businesses,
      desc: "Active business listings",
      icon: (
        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
    },
    {
      label: "Services",
      value: stats.services,
      desc: "Service providers listed",
      icon: (
        <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx={12} cy={12} r={3} strokeWidth={2} />
        </svg>
      ),
      bg: "bg-violet-500/10 border-violet-500/20 text-violet-700",
    },
    {
      label: "Jobs",
      value: stats.jobs,
      desc: "Active jobs openings",
      icon: (
        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-700",
    },
    {
      label: "Properties",
      value: stats.properties,
      desc: "Properties listed",
      icon: (
        <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-700",
    },
    {
      label: "Resale",
      value: stats.resale,
      desc: "Resale items listed",
      icon: (
        <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bg: "bg-orange-500/10 border-orange-500/20 text-orange-700",
    },
    {
      label: "Events",
      value: stats.events,
      desc: "Upcoming town events",
      icon: (
        <svg className="h-5 w-5 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
        </svg>
      ),
      bg: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-700",
    },
    {
      label: "News",
      value: stats.news,
      desc: "Published news updates",
      icon: (
        <svg className="h-5 w-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: "bg-pink-500/10 border-pink-500/20 text-pink-700",
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Mission Control Dashboard</h1>
            <button
              onClick={() => setShowInfo(true)}
              title="Show Dashboard Guide"
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="h-5 w-5 text-teal-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Unified operations, campaigns, revenue, and intelligence hub for the <span className="text-teal-600 font-bold">Manasa Upay</span> hyperlocal ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshLogs}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <svg className={`h-4 w-4 ${loading || activityLoading ? "animate-spin text-teal-600" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
            Sync Platform State
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-250 px-4 py-2.5 rounded-2xl shadow-sm text-emerald-800 font-black text-xs animate-pulse-glow">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE NODE: ACTIVE
          </div>
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

      {/* Platform Health Grid */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Platform Health Indicator</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {healthCards.map((card, index) => (
            <div 
              key={card.label} 
              className="glass-card glow-hover animate-slide-up rounded-2xl p-5 bg-white border border-slate-100 shadow-sm relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between gap-3 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</span>
                <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center border border-transparent`}>
                  {card.icon}
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-3" />
              ) : (
                <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
              )}
              <p className="mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wide">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Missed Demand Opportunities Banner */}
      <section className="glass-card rounded-3xl p-6 bg-gradient-to-tr from-slate-900 via-slate-950 to-teal-950 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-rose-500/5 rounded-full blur-2xl" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              Pure Market Opportunities
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">Missed Demand Summary</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Uncover Unmet Local Demands in Manasa
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
            Every failed search with 0 results represents direct consumer intent. Add categories instantly without any developer code to capture immediate traffic and local revenue!
          </p>
        </div>
        <Link
          href="/search-intelligence"
          className="shrink-0 rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-900 shadow-lg hover:bg-slate-100 active:scale-95 transition-all text-center relative z-10"
        >
          🔍 View Failed Searches (Missed Demand)
        </Link>
      </section>

      {/* Core Split: Revenue Snapshot & Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Revenue Snapshot Card */}
        <section className="glass-card rounded-3xl p-6 bg-white border border-slate-150 shadow-sm lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Revenue Snapshot</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Campaigns & monetizations insights</p>
              </div>
              <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-150">
                Estimated Net Margin: 94%
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mt-5">
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Sponsored Listings</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{revenue.sponsored.toLocaleString()}</p>
                <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full group-hover:scale-x-110 transition-transform origin-left" style={{ width: "65%" }} />
                </div>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">Includes Shops & Services</span>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Banner Campaigns</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{revenue.banners.toLocaleString()}</p>
                <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full group-hover:scale-x-110 transition-transform origin-left" style={{ width: "80%" }} />
                </div>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">Sliders and Inline Ads</span>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Featured Placement</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{revenue.featured.toLocaleString()}</p>
                <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full group-hover:scale-x-110 transition-transform origin-left" style={{ width: "45%" }} />
                </div>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">Jobs, Properties & Resales</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="p-5 border border-teal-100 rounded-2xl bg-teal-50/30 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-teal-600">Current Monthly Revenue</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">₹{revenue.monthly.toLocaleString()}</p>
                </div>
                <svg className="h-10 w-10 text-teal-600/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 14a2 2 0 110-4h1.5" />
                </svg>
              </div>

              <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Lifetime Gross Yield</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">₹{revenue.lifetime.toLocaleString()}</p>
                </div>
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100/60 pt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              {getLatestActivityText()}
            </span>
            <Link href="/export-center" className="text-teal-650 hover:underline">
              Download Revenue Statement &rarr;
            </Link>
          </div>
        </section>

        {/* Realtime Activity Stream Card */}
        <section className="glass-card rounded-3xl p-6 bg-white border border-slate-150 shadow-sm lg:col-span-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Activity Stream</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Real-time system actions</p>
              </div>
              <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-150">
                {activityRanges.map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => setActivityRange(range.key)}
                    className={`rounded px-2 py-1 text-[9px] font-black uppercase transition-all ${
                      activityRange === range.key
                        ? "bg-white text-teal-700 shadow-sm border border-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {range.key}
                  </button>
                ))}
              </div>
            </div>

            {activityError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-[10px] font-bold text-red-700">
                {activityError}
              </div>
            )}

            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-1 flex-1">
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-12 rounded-2xl bg-slate-150/40 animate-pulse" />
                  ))}
                </div>
              ) : activityEvents.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] text-slate-500 text-center py-10">
                  No active logs recorded in this period.
                </div>
              ) : (
                activityEvents.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs font-semibold relative pl-4 border-l border-slate-150 py-0.5">
                    <span className={`absolute left-[-3.5px] top-1.5 h-1.5 w-1.5 rounded-full ${
                      act.type === "user" ? "bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.6)]" :
                      act.type === "notif" ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" :
                      act.type === "business" ? "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" :
                      act.type === "ads" ? "bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.6)]" :
                      act.type === "property" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" :
                      "bg-slate-400"
                    }`} />
                    <div className="flex-1">
                      <p className="text-slate-700 leading-snug font-bold">{act.event}</p>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide mt-0.5 block">
                        {act.time && !isNaN(Date.parse(act.time)) ? new Date(act.time).toLocaleTimeString() : "Just now"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span>Security Mode: Encrypted</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </section>
      </div>

      {/* Quick Launch Directory Grid */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Hyperlocal Operations Command Center</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_GROUPS.flatMap((group, gIdx) => 
            group.items.map((item, iIdx) => {
              if (item.href === "/") return null;
              const delay = (gIdx * 3 + iIdx) * 20;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-150 bg-white p-5 transition-all duration-300 hover:border-teal-500/20 hover:bg-slate-50/50 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-1 relative overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{group.title}</span>
                    <p className="text-sm font-black text-slate-800 group-hover:text-teal-600 transition-colors mt-1">{item.label}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 border-t border-slate-100/60 pt-3">
                    <span className="text-[9px] font-black uppercase text-teal-600 tracking-wider">Access OS &rarr;</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500/60 group-hover:scale-125 transition-transform" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <AdminInfoDrawer
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Mission Control Dashboard"
        subtitle="Platform Command Center"
        purpose="Aggregates system health metrics, monthly revenue streams, direct consumer search intelligence, and real-time operations activity logs."
        sections={[
          {
            title: "Platform Health Indicator",
            desc: "Displays registered user volumes, live voice call minutes, database storage consumption, and active partner directories."
          },
          {
            title: "Missed Demand Opportunities",
            desc: "Provides instant highlights of consumer searches returning 0 results. Add these categories immediately to fulfill demand!"
          },
          {
            title: "Revenue Snapshot",
            desc: "Estimated monetization streams based on priority listing upgrades, active banner slots, and featured placements."
          },
          {
            title: "Realtime Activity Feed",
            desc: "Auditable live log stream of directory entries, modifications, and partner registrations."
          }
        ]}
      />
    </div>
  );
}
