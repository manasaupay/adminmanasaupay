"use client";

import React, { useState } from "react";

type NotificationCampaign = {
  id: string;
  title: string;
  message: string;
  audience: string;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  openRate: number;
  ctr: number;
  scheduled_at?: string;
  status: "sent" | "failed" | "scheduled";
};

export default function NotificationOsPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "history">("builder");
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([
    { id: "1", title: "🪔 Diwali Special: Shop Local in Manasa!", message: "Get up to 50% discount on sweet packs, fashion, and home lighting! Tap to see deals.", audience: "All Users", sent: 8400, delivered: 8350, failed: 50, opened: 6800, openRate: 81.4, ctr: 44.5, status: "sent" },
    { id: "2", title: "🏪 Verma Sweets is Now Live!", message: "Order your favorite Laddus and cakes online instantly. Tap to explore store.", audience: "Food Lovers", sent: 3200, delivered: 3180, failed: 20, opened: 2400, openRate: 75.4, ctr: 38.0, status: "sent" },
    { id: "3", title: "📢 Weather Notice: Heavy rains alert", message: "Administration requests citizens to stay indoors and avoid low lying areas.", audience: "All Users", sent: 8400, delivered: 8390, failed: 10, opened: 7900, openRate: 94.1, ctr: 22.0, status: "sent" },
    { id: "4", title: "🛒 Resale Premium Deals Blast", message: "Special carousels for second hand mobile phones and motorcycles in Manasa.", audience: "Inactive Users", sent: 0, scheduled_at: "2026-06-05 18:00", delivered: 0, failed: 0, opened: 0, openRate: 0, ctr: 0, status: "scheduled" },
  ]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    image: "",
    deepLink: "/offers",
    audience: "all",
  });

  const [sendSuccess, setSendSuccess] = useState(false);

  const handleLaunchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;

    const newCampaign: NotificationCampaign = {
      id: (campaigns.length + 1).toString(),
      title: form.title,
      message: form.message,
      audience: form.audience === "all" ? "All Users" : form.audience === "new" ? "New Registrations" : "Active Users",
      sent: 8400,
      delivered: 8370,
      failed: 30,
      opened: 0,
      openRate: 0,
      ctr: 0,
      status: "sent",
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
    setForm({ title: "", message: "", image: "", deepLink: "/offers", audience: "all" });
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 3000);
  };

  const applyTemplate = (templateType: string) => {
    switch (templateType) {
      case "offer":
        setForm({
          title: "🔥 Special Discount Alert! 🏷️",
          message: "A new exclusive deal has been listed by a local shop. Get up to 30% off today only! Tap to view offer.",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
          deepLink: "/offers",
          audience: "all",
        });
        break;
      case "news":
        setForm({
          title: "📰 Breaking Local News Alert!",
          message: "Administration has released a new guidelines notice regarding town developments. Tap to read details.",
          image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
          deepLink: "/news",
          audience: "all",
        });
        break;
      case "event":
        setForm({
          title: "📅 New Local Event Announced! 🎪",
          message: "A town cultural event and gathering is scheduled for this weekend. Check timings and location.",
          image: "https://images.unsplash.com/photo-1511578314322-379afb476865",
          deepLink: "/events",
          audience: "all",
        });
        break;
      case "property":
        setForm({
          title: "🏠 Premium Property listed in Manasa",
          message: "A newly constructed independent house / plot has been listed for rental/sale. Tap to inspect photos.",
          image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
          deepLink: "/properties",
          audience: "all",
        });
        break;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Notification OS</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Construct push campaigns, segment user audiences, apply campaign templates, and track delivery CTR in real-time.
          </p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(["builder", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white text-teal-700 shadow-sm border border-slate-150"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "builder" ? "Campaign Builder" : "Analytics & History"}
            </button>
          ))}
        </div>
      </div>

      {sendSuccess && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Push broadcast initialized! Multicast multicast blast successfully triggered to FCM endpoints.
        </div>
      )}

      {/* Tab 1: Builder */}
      {activeTab === "builder" && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Builder Form */}
          <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900">Broadcast Builder</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Configure fcm alert details, actions, and media links.</p>
            </div>

            <form onSubmit={handleLaunchNotification} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Push Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verma Sweets is Now Live! 🏪"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Notification Message Body</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Order your favorite sweets online. Tap to see the details..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Deep Link Action (In-app routing)</label>
                  <select
                    value={form.deepLink}
                    onChange={(e) => setForm({ ...form, deepLink: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs text-slate-750 focus:border-teal-500 outline-none cursor-pointer"
                  >
                    <option value="/offers">Offers Directory Page</option>
                    <option value="/news">News Feed Screen</option>
                    <option value="/events">Upcoming Events Carousel</option>
                    <option value="/properties">Real Estate listings</option>
                    <option value="/resale">Resale Market list</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400">Target Audience Scope</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs text-slate-750 focus:border-teal-500 outline-none cursor-pointer"
                  >
                    <option value="all">Broadcast: All Active Installs</option>
                    <option value="new">Segments: Registered Today / New</option>
                    <option value="active">Active: Opened app in last 7 days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Campaign Image banner URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-1"
              >
                🚀 Initialize Multicast push Blast
              </button>
            </form>
          </section>

          {/* Campaign Templates Side-Widget */}
          <section className="space-y-4">
            <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Campaign Templates</h3>
                <p className="text-[10px] text-slate-405 font-semibold mt-0.5">
                  Select and load design templates instantly to save typing time.
                </p>
              </div>

              <div className="grid gap-2.5">
                {[
                  { id: "offer", label: "Special Deal / Coupon offer Alert", color: "border-amber-100 hover:border-amber-250 bg-amber-50/20 text-amber-800" },
                  { id: "news", label: "Breaking Local City Notice Alert", color: "border-blue-100 hover:border-blue-250 bg-blue-50/20 text-blue-800" },
                  { id: "event", label: "Town Cultural Event Gathering Announcement", color: "border-purple-100 hover:border-purple-250 bg-purple-50/20 text-purple-800" },
                  { id: "property", label: "Premium Plot / House Listed in Town", color: "border-rose-100 hover:border-rose-250 bg-rose-50/20 text-rose-800" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className={`w-full text-left p-3.5 border rounded-2xl transition-all active:scale-98 font-bold text-xs cursor-pointer ${tpl.color}`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Preview card */}
            <div className="glass-card rounded-3xl border border-slate-150 bg-slate-50 p-5 shadow-inner space-y-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-teal-600">Simulated Alert Preview</p>
              <div className="p-4 border border-slate-200 bg-white rounded-2xl shadow space-y-2 max-w-[280px] mx-auto relative overflow-hidden">
                <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    Manasa Upay
                  </span>
                  <span>Now</span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">{form.title || "Diwali Special Deals"}</p>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-0.5">{form.message || "Tap to discover discounts..."}</p>
                </div>
                {form.image && (
                  <div className="h-20 w-full bg-slate-100 rounded-xl overflow-hidden relative border">
                    <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Analytics History */}
      {activeTab === "history" && (
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Push Delivery History</h2>
            <p className="text-xs text-slate-550 mt-0.5 font-semibold">Delivery audit log calculated across device registrations.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Campaign Headline</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Audience</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Sent</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Delivered</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Failed</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Opened</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">CTR</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">
                      <p>{c.title}</p>
                      {c.scheduled_at && <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Scheduled at: {c.scheduled_at}</span>}
                    </td>
                    <td className="px-5 py-3">{c.audience}</td>
                    <td className="px-5 py-3 text-center">{c.sent > 0 ? c.sent.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3 text-center text-emerald-600">{c.delivered > 0 ? c.delivered.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3 text-center text-red-500">{c.failed > 0 ? c.failed : "—"}</td>
                    <td className="px-5 py-3 text-center">{c.opened > 0 ? c.opened.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3 text-center text-teal-600 font-black">{c.ctr > 0 ? `${c.ctr}%` : "—"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        c.status === "sent" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                        c.status === "scheduled" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                        "bg-red-50 text-red-700 border border-red-150"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
