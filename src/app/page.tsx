"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ActivityRangeKey = "today" | "24h" | "7d" | "30d";
type ActivityEvent = { id: string; time: string; event: string; type: string };

export default function DashboardPage() {
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
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityRange, setActivityRange] = useState<ActivityRangeKey>("24h");

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
      setStats({
        users: String(data.users ?? "—"),
        activeUsersToday: String(data.activeUsersToday ?? data.newRegistrations ?? "—"),
        newRegistrations: String(data.newRegistrations ?? "—"),
        businesses: String(data.businesses ?? "—"),
        services: String(data.services ?? "—"),
        jobs: String(data.jobs ?? "—"),
        properties: String(data.properties ?? "—"),
        resale: String(data.resale ?? "—"),
        events: String(data.events ?? "—"),
        news: String(data.news ?? "—"),
        activeAds: String(data.activeAds ?? "—"),
        sponsoredShops: String(data.sponsoredShops ?? "—"),
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
    void loadStats();
  }, []);

  useEffect(() => {
    void loadActivity(activityRange);
  }, [activityRange]);

  const refreshLogs = () => {
    void loadActivity(activityRange);
  };

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setStats({
          users: String(d.users),
          businesses: String(d.businesses),
          activeAds: String(d.activeAds),
        });
      })
      .catch(() => setError("Could not sync real-time platform metrics"))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Users",
      value: stats.users,
      desc: "Registered users and partners",
      icon: (
        <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bg: "bg-teal-50 border-teal-100",
    },
    {
      label: "Active Users Today",
      value: stats.activeUsersToday,
      desc: "Users active in the last 24h",
      icon: (
        <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: "bg-sky-50 border-sky-100",
    },
    {
      label: "New Registrations",
      value: stats.newRegistrations,
      desc: "Registered in the last 24h",
      icon: (
        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      bg: "bg-amber-50 border-amber-100",
    },
    {
      label: "Businesses",
      value: stats.businesses,
      desc: "Active business listings",
      icon: (
        <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v14h6V7m8 0v14h-6V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2" />
        </svg>
      ),
      bg: "bg-orange-50 border-orange-100",
    },
    {
      label: "Services",
      value: stats.services,
      desc: "Service providers & listings",
      icon: (
        <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-6 3h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      bg: "bg-violet-50 border-violet-100",
    },
    {
      label: "Jobs",
      value: stats.jobs,
      desc: "Open job listings",
      icon: (
        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7V3H8v4M5 8h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z" />
        </svg>
      ),
      bg: "bg-indigo-50 border-indigo-100",
    },
    {
      label: "Properties",
      value: stats.properties,
      desc: "Active property listings",
      icon: (
        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 001 1h3M9 21h6" />
        </svg>
      ),
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Resale",
      value: stats.resale,
      desc: "Resale listings live",
      icon: (
        <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bg: "bg-cyan-50 border-cyan-100",
    },
    {
      label: "Events",
      value: stats.events,
      desc: "Upcoming event cards",
      icon: (
        <svg className="h-5 w-5 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
        </svg>
      ),
      bg: "bg-fuchsia-50 border-fuchsia-100",
    },
    {
      label: "News",
      value: stats.news,
      desc: "Published news items",
      icon: (
        <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: "bg-rose-50 border-rose-100",
    },
  ];

  const quickActions = [
    { label: "Create Partner Login", href: "/users", color: "from-teal-500 to-emerald-600", desc: "Build logins and profiles" },
    { label: "Add New Module", href: "/add-new", color: "from-indigo-500 to-blue-600", desc: "Dynamic Content Engine" },
    { label: "Global Push Alert", href: "/notifications", color: "from-amber-500 to-orange-600", desc: "Broadcast push notifications" },
    { label: "Manage Categories", href: "/categories", color: "from-purple-500 to-pink-600", desc: "Configure dynamic classifications" },
    { label: "Approve Local Shops", href: "/businesses", color: "from-sky-500 to-indigo-600", desc: "Directory verify and listings" },
    { label: "System Settings", href: "/settings", color: "from-slate-600 to-slate-800", desc: "Configure server constants" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Operations Control Center</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Unified light dashboard and setup console for the <span className="text-teal-600 font-bold">Manasa Upay</span> hyperlocal engine.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm relative">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 glow-active shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Supabase Node: Live Connection</span>
        </div>
      </div>

      {/* Metrics Row */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-5 bg-white border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</span>
              <div className={`h-9 w-9 rounded-xl ${card.bg} flex items-center justify-center border`}>
                {card.icon}
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded mt-3" />
            ) : (
              <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight relative z-10">{card.value}</p>
            )}
            <p className="mt-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wide relative z-10">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Split Quick Actions & Simulated Activity Logs */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left 2 Columns: Central Command Quick Actions */}
        <section className="glass-card rounded-3xl p-6 bg-white border border-slate-150 shadow-sm lg:col-span-2 space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Console Core Quick Actions</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Immediate shortcuts to execute operations workflows without digging through groups.</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex flex-col justify-between rounded-2xl border border-slate-150 bg-white p-4.5 transition-all duration-200 hover:border-teal-500/20 hover:bg-slate-50/50 hover:shadow-md relative overflow-hidden"
              >
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800 group-hover:text-teal-600 transition-colors">{action.label}</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-snug">{action.desc}</p>
                </div>
                <div className="flex items-center justify-between mt-4 border-t border-slate-100/60 pt-3">
                  <span className="text-[9px] font-black uppercase text-teal-600 tracking-wider">Launch &rarr;</span>
                  <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-tr ${action.color} opacity-60 group-hover:scale-125 transition-transform`} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Right 1 Column: Realtime Activity Feed */}
        <section className="glass-card rounded-3xl p-6 bg-white border border-slate-150 shadow-sm lg:col-span-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Realtime Activity Stream</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live feed across users, listings, ads, and notifications</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activityRanges.map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => setActivityRange(range.key)}
                    className={`rounded-full border px-3 py-2 text-[10px] font-bold transition-all ${
                      activityRange === range.key
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={refreshLogs}
                  title="Refresh feed"
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>
            {activityError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-[10px] font-bold text-red-700">
                {activityError}
              </div>
            )}
            <div className="space-y-3.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : activityEvents.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] text-slate-600">
                  No recent activity found for the selected range. Try a wider window or refresh.
                </div>
              ) : (
                activityEvents.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs font-semibold relative pl-4 border-l border-slate-150 py-0.5">
                    <span className={`absolute left-[-3.5px] top-1.5 h-1.5 w-1.5 rounded-full ${
                      act.type === "user" ? "bg-teal-500" :
                      act.type === "notif" ? "bg-amber-500" :
                      act.type === "business" ? "bg-indigo-500" :
                      act.type === "ads" ? "bg-pink-500" :
                      act.type === "property" ? "bg-emerald-500" :
                      "bg-slate-400"
                    }`} />
                    <div className="flex-1">
                      <p className="text-slate-700 leading-snug font-medium">{act.event}</p>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide mt-0.5 block">{act.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Operational Mode: Active</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 glow-active" />
          </div>
        </section>
      </div>

      {/* Visual Partner Guide to clarify "User Create & Assign" flow */}
      <div className="glass-card rounded-3xl p-6 bg-white border border-slate-150 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex flex-col md:flex-row items-start gap-5 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100 shrink-0">
            <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-base font-black text-slate-900">Partner Creation & Deployment Workflow</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                Follow these simple visual steps to set up partner accounts and link them to app profiles successfully.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-4 mt-2">
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 relative shadow-sm hover:bg-white hover:border-slate-200 transition-all">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-200 select-none">01</span>
                <p className="text-xs font-black text-teal-600 uppercase tracking-wider">Access Users Tab</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  Go to <Link href="/users" className="text-teal-600 font-bold underline hover:text-teal-700">User Management</Link> where the new partner builder sits above the user list.
                </p>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 relative shadow-sm hover:bg-white hover:border-slate-200 transition-all">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-200 select-none">02</span>
                <p className="text-xs font-black text-teal-600 uppercase tracking-wider">Choose Assign Option</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  Fill credentials. Select <strong className="text-slate-700">"+ Create New Profile"</strong> to make a fresh directory entry instantly.
                </p>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 relative shadow-sm hover:bg-white hover:border-slate-200 transition-all">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-200 select-none">03</span>
                <p className="text-xs font-black text-teal-600 uppercase tracking-wider">Specify Service</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  Select the exact category (e.g. AC Repair, Plumber, Shop) so the user gets created for that target service automatically!
                </p>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 relative shadow-sm hover:bg-white hover:border-slate-200 transition-all">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-200 select-none">04</span>
                <p className="text-xs font-black text-teal-600 uppercase tracking-wider">Done & Active</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  Click Create. The partner is generated and linked. They can instantly log into the mobile app and manage operations!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Quick-Links grouped navigation */}
      <div className="space-y-3 relative z-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hyperlocal Navigation Directory</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_GROUPS.filter((g) => g.title !== "Overview").flatMap((group) => 
            group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:border-teal-500/20 hover:bg-slate-50/30 hover:shadow"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{item.label}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{group.title}</p>
                </div>
                <svg className="h-4 w-4 text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
