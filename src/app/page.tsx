"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    users: "—",
    businesses: "—",
    activeAds: "—",
  });
  const [error, setError] = useState<string | null>(null);

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
      .catch(() => setError("Could not load stats"));
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users },
    { label: "Businesses", value: stats.businesses },
    { label: "Active Ads", value: stats.activeAds },
    { label: "Notification Clicks", value: "—" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-slate-600">Manasa Upay — live counts from Supabase.</p>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-teal-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick links</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_ITEMS.filter((n) => n.href !== "/").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-teal-300 hover:bg-teal-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
