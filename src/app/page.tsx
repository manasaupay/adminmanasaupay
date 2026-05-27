"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_GROUPS } from "@/lib/constants";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: "—",
    businesses: "—",
    activeAds: "—",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      .catch(() => setError("Could not load platform metrics"))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { 
      label: "Platform Users", 
      value: stats.users, 
      desc: "Registered citizens & partners", 
      icon: (
        <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      label: "Registered Shops", 
      value: stats.businesses, 
      desc: "Directory shops & outlets", 
      icon: (
        <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      label: "Active Campaigns", 
      value: stats.activeAds, 
      desc: "Live promotional slider ads", 
      icon: (
        <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      label: "Call Sessions", 
      value: "Active", 
      desc: "Real-time WebRTC channels", 
      icon: (
        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Console Overview</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Operational statistics and partner setups for <span className="text-teal-400 font-bold">Manasa Upay</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 glow-active shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection: Active</span>
        </div>
      </div>

      {/* Metrics Row */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-semibold text-red-400 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/30">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
              <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                {card.icon}
              </div>
            </div>
            {loading ? (
              <div className="h-9 w-16 bg-slate-800 animate-pulse rounded mt-3" />
            ) : (
              <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
            )}
            <p className="mt-1.5 text-[11px] text-slate-500 font-bold">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Visual Partner Guide to clarify "User Create & Assign" flow */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/20">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0">
            <svg className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-lg font-black text-white">Partner Creation & Assignment Made Easy</h2>
              <p className="text-xs text-slate-400 mt-1">
                Follow these simple visual steps to set up partner accounts and link them to app profiles successfully.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-4 mt-2">
              <div className="p-4 border border-slate-900 rounded-xl bg-slate-950/40 relative">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-800/80">01</span>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Access Users Tab</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Go to <Link href="/users" className="text-teal-400 font-bold underline hover:text-teal-300">User Management</Link> where the new partner builder sits above the user list.
                </p>
              </div>

              <div className="p-4 border border-slate-900 rounded-xl bg-slate-950/40 relative">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-800/80">02</span>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Choose Assign Option</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Fill partner credentials. In the drop-down, select <strong className="text-slate-200">"+ Create New Profile"</strong> to make a fresh directory entry instantly.
                </p>
              </div>

              <div className="p-4 border border-slate-900 rounded-xl bg-slate-950/40 relative">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-800/80">03</span>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Specify Service</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Select the exact category (e.g. AC Repair, Plumber, Shop) so the user gets created for that target service automatically!
                </p>
              </div>

              <div className="p-4 border border-slate-900 rounded-xl bg-slate-950/40 relative">
                <span className="absolute top-3 right-3 text-lg font-black text-slate-800/80">04</span>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Done & Active</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Click Create. The partner is generated and linked. They can instantly log into the mobile app and manage calls/chats!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Quick-Links */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Navigation Hub</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_GROUPS.filter((g) => g.title !== "Overview").flatMap((group) => 
            group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-slate-900 bg-slate-950/30 px-5 py-4 transition-all duration-200 hover:border-teal-500/20 hover:bg-slate-900/30 hover:shadow-lg"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{group.title}</p>
                </div>
                <svg className="h-4 w-4 text-slate-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
