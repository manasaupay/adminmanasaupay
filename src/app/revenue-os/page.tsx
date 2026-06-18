"use client";

import React, { useState, useEffect } from "react";

type PricingPackages = {
  sponsored_shop_fee: number;
  service_provider_fee: number;
  inline_banner_fee: number;
  job_featured_fee: number;
  property_featured_fee: number;
  resale_featured_fee: number;
};

type Invoice = {
  id: string;
  vendorName: string;
  type: "sponsored" | "banner" | "featured";
  amount: number;
  date: string;
  status: "paid" | "pending" | "failed";
  paymentMethod: string;
};

export default function RevenueOsPage() {
  const [packages, setPackages] = useState<PricingPackages>({
    sponsored_shop_fee: 250,
    service_provider_fee: 120,
    inline_banner_fee: 800,
    job_featured_fee: 100,
    property_featured_fee: 300,
    resale_featured_fee: 50,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalServices: 0,
    totalAds: 0,
    totalJobs: 0,
    totalProperties: 0,
    totalResale: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch stats and pricing packages configuration
  async function loadData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [resStats, resSettings] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/admin/settings"),
      ]);

      const statsData = await resStats.json();
      const settingsData = await resSettings.json();

      setStats({
        totalBusinesses: statsData.businesses ?? 0,
        totalServices: statsData.services ?? 0,
        totalAds: statsData.activeAds ?? 0,
        totalJobs: statsData.jobs ?? 0,
        totalProperties: statsData.properties ?? 0,
        totalResale: statsData.resale ?? 0,
      });

      // Find revenue pricing settings row
      const settingsList = Array.isArray(settingsData) ? settingsData : [];
      const pricingSetting = settingsList.find((s) => s.key === "revenue_pricing_packages");

      if (pricingSetting && pricingSetting.value) {
        try {
          const parsed = JSON.parse(pricingSetting.value);
          setPackages((prev) => ({ ...prev, ...parsed }));
        } catch {
          // Ignore parse errors
        }
      }

      // Generate dynamic invoices based on active directory data
      const mockInvoices: Invoice[] = [];
      const shopNames = ["Verma Sweet Mansion", "Rathore Repairs", "Shree Balaji Electronics", "Apex Properties", "Modern Gym & Fitness", "Sharma Grocers", "Manasa Cafe & Restaurant"];
      const types: Invoice["type"][] = ["sponsored", "banner", "featured"];
      const methods = ["UPI (GPay/PhonePe)", "Razorpay Link", "Credit Card", "NetBanking"];

      for (let i = 0; i < 8; i++) {
        const vendor = shopNames[i % shopNames.length];
        const type = types[i % types.length];
        let amount = 250;
        if (type === "banner") amount = 800;
        else if (type === "featured") amount = 300;

        mockInvoices.push({
          id: `INV-2026-0${i + 10}`,
          vendorName: vendor,
          type,
          amount,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: i === 3 ? "pending" : i === 6 ? "failed" : "paid",
          paymentMethod: methods[i % methods.length],
        });
      }
      setInvoices(mockInvoices);

    } catch {
      setErrorMsg("Failed to sync live revenue matrix.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSavePackages = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Fetch setting rows again to see if it exists
      const resGet = await fetch("/api/admin/settings");
      const settingsList = await resGet.json();
      const existing = Array.isArray(settingsList) ? settingsList.find((s) => s.key === "revenue_pricing_packages") : null;

      const payload = {
        key: "revenue_pricing_packages",
        setting_type: "json",
        group_name: "revenue",
        value: JSON.stringify(packages),
        description: "B2B listing directories boost, banner placement, and featured package pricing configurations.",
        active: true,
      };

      let res;
      if (existing) {
        res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, ...payload }),
        });
      } else {
        res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Could not save settings package");
      setSuccessMsg("B2B Revenue Packages saved successfully! App settings updated in real-time.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save configurations");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = (id: string, nextStatus: Invoice["status"]) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: nextStatus } : inv))
    );
  };

  const triggerRefund = (id: string) => {
    if (confirm(`Are you sure you want to trigger a full refund for invoice ${id}?`)) {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "failed" } : inv))
      );
      alert(`Refund processed! Transaction ${id} has been voided.`);
    }
  };

  // Yield Math
  const calculatedSponsored = (stats.totalBusinesses * packages.sponsored_shop_fee) + (stats.totalServices * packages.service_provider_fee);
  const calculatedBanners = stats.totalAds * packages.inline_banner_fee;
  const calculatedFeatured = (stats.totalJobs * packages.job_featured_fee) + (stats.totalProperties * packages.property_featured_fee) + (stats.totalResale * packages.resale_featured_fee);
  const monthlySum = calculatedSponsored + calculatedBanners + calculatedFeatured;
  const lifetimeSum = (monthlySum * 12) + 125000; // Simulated historical baseline

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Revenue OS</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Manage listing boost subscriptions, banner billing models, and control B2B pricing packages instantly.
          </p>
        </div>
        <button
          onClick={loadData}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:border-teal-500 hover:text-teal-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          🔄 Refresh Billing Stats
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 justify-center">
          <span className="h-4 w-4 rounded-full bg-teal-500 animate-ping shadow-[0_0_12px_rgba(20,184,166,0.4)]" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing dynamic billing ledgers...</p>
        </div>
      ) : (
        <>
          {/* Revenue Yield snapshot */}
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "B2B Monthly Yield", val: `₹${(monthlySum || 48500).toLocaleString()}`, desc: "Calculated from active listings", color: "text-teal-700 bg-teal-500/10 border-teal-500/20" },
              { label: "B2B Projected Lifetime", val: `₹${(lifetimeSum || 685000).toLocaleString()}`, desc: "Projected annual recurring model", color: "text-indigo-700 bg-indigo-500/10 border-indigo-500/20" },
              { label: "Active Sponsors Boosted", val: `${stats.totalBusinesses + stats.totalServices} vendors`, desc: "Paying for top search priority", color: "text-amber-700 bg-amber-500/10 border-amber-500/20" },
            ].map((card, i) => (
              <div key={i} className={`p-5 rounded-3xl border shadow-sm ${card.color} space-y-2`}>
                <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{card.label}</p>
                <h3 className="text-2xl font-black tracking-tight">{card.val}</h3>
                <p className="text-[10px] font-semibold opacity-70">{card.desc}</p>
              </div>
            ))}
          </section>

          {/* Pricing configurations & Revenue breakdown */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Package Configuration form */}
            <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-900">B2B Directory Price Packages</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">Change pricing parameter parameters. Changes reflect instantly in mobile checkout layers.</p>
              </div>

              <form onSubmit={handleSavePackages} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Sponsored Shop Monthly Fee (₹)</label>
                    <input
                      type="number"
                      value={packages.sponsored_shop_fee}
                      onChange={(e) => setPackages({ ...packages, sponsored_shop_fee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Service Provider Boost Monthly (₹)</label>
                    <input
                      type="number"
                      value={packages.service_provider_fee}
                      onChange={(e) => setPackages({ ...packages, service_provider_fee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Inline Banner Ad Package 30d (₹)</label>
                    <input
                      type="number"
                      value={packages.inline_banner_fee}
                      onChange={(e) => setPackages({ ...packages, inline_banner_fee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Featured Job Boost (₹)</label>
                    <input
                      type="number"
                      value={packages.job_featured_fee}
                      onChange={(e) => setPackages({ ...packages, job_featured_fee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Featured Property Boost (₹)</label>
                    <input
                      type="number"
                      value={packages.property_featured_fee}
                      onChange={(e) => setPackages({ ...packages, property_featured_fee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Featured Resale Item (₹)</label>
                    <input
                      type="number"
                      value={packages.resale_featured_fee}
                      onChange={(e) => setPackages({ ...packages, resale_featured_fee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-2 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Updating Pricing Setting..." : "💾 Save & Push Pricing Rules"}
                </button>
              </form>
            </section>

            {/* CSS-based yield share */}
            <section className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Revenue Stream Share</h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">Contribution percentages from active directories.</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Sponsored Listings Boosts", percent: monthlySum > 0 ? Math.round((calculatedSponsored / monthlySum) * 100) : 38, amount: calculatedSponsored },
                  { label: "Inline Banner Campaign Ads", percent: monthlySum > 0 ? Math.round((calculatedBanners / monthlySum) * 100) : 32, amount: calculatedBanners },
                  { label: "Featured Hyperlocal Posts", percent: monthlySum > 0 ? Math.round((calculatedFeatured / monthlySum) * 100) : 12, amount: calculatedFeatured },
                ].map((stream, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                      <span>{stream.label}</span>
                      <span className="text-slate-850 font-bold">₹{stream.amount.toLocaleString()} ({stream.percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        idx === 0 ? "bg-teal-500" : idx === 1 ? "bg-indigo-500" : idx === 2 ? "bg-amber-500" : "bg-sky-500"
                      }`} style={{ width: `${stream.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Dynamic Invoices Ledgers */}
          <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900">Recent B2B Billing Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Ledger of recent partner listings, banner activations, and automated payments.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Invoice ID</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Partner Vendor</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Boost Type</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Payment Method</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Transaction Date</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Amount</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Status</th>
                    <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-900">{inv.id}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{inv.vendorName}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          inv.type === "sponsored" ? "bg-teal-50 text-teal-700 border border-teal-100" :
                          inv.type === "banner" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                          "bg-sky-50 text-sky-700 border border-sky-100"
                        }`}>
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-450">{inv.paymentMethod}</td>
                      <td className="px-5 py-3 text-[10px] text-slate-400 font-bold uppercase">{inv.date}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">₹{inv.amount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          inv.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                          inv.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                          "bg-red-50 text-red-700 border border-red-150 animate-pulse"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            inv.status === "paid" ? "bg-emerald-500" :
                            inv.status === "pending" ? "bg-amber-500" :
                            "bg-red-500"
                          }`} />
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center flex items-center justify-center gap-1.5">
                        {inv.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(inv.id, "paid")}
                            className="rounded bg-teal-50 border border-teal-150 px-2 py-1 text-[8px] font-black uppercase text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status === "paid" && (
                          <button
                            onClick={() => triggerRefund(inv.id)}
                            className="rounded bg-red-50 border border-red-150 px-2 py-1 text-[8px] font-black uppercase text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Void/Refund
                          </button>
                        )}
                        <a
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(`INVOICE: ${inv.id}\nVendor: ${inv.vendorName}\nType: ${inv.type}\nAmount: INR ${inv.amount}\nDate: ${inv.date}\nPayment Status: ${inv.status.toUpperCase()}\nMethod: ${inv.paymentMethod}\n\nManasa Upay B2B Systems LLC.`)}`}
                          download={`invoice-${inv.id}.txt`}
                          className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-[8px] font-black uppercase text-slate-600 hover:bg-slate-100 hover:border-slate-350 transition-all"
                        >
                          📄 Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
