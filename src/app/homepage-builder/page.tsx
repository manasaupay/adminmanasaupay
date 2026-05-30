"use client";

import { useEffect, useState } from "react";

type Section = {
  id: string;
  name: string;
  visible: boolean;
  desc: string;
  priority: number;
};

export default function HomepageBuilderPage() {
  const [sections, setSections] = useState<Section[]>([
    { id: "banners", name: "Hero Banners Slider", visible: true, desc: "Active campaign ads and promo carousels", priority: 1 },
    { id: "offers", name: "Trending Deals & Offers", visible: true, desc: "Direct cashbacks and shop discounts", priority: 2 },
    { id: "businesses", name: "Local Shops & Directory", visible: true, desc: "Nearest vetted businesses and store listings", priority: 3 },
    { id: "properties", name: "Real Estate Market", visible: false, desc: "Rental listings and comercial plots in Manasa", priority: 4 },
    { id: "jobs", name: "Local Job Openings", visible: true, desc: "Part time, full time, and partner job alerts", priority: 5 },
    { id: "news", name: "City News & Notices", visible: true, desc: "Breaking town announcements and daily feeds", priority: 6 },
    { id: "resale", name: "Resale Market", visible: false, desc: "Used mobile phones, bikes, and home items", priority: 7 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<"standard" | "grid_compact" | "minimalist">("standard");

  // Load layout from Supabase Settings if available
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const configSetting = data.find((s: any) => s.key === "homepage_layout_config");
          if (configSetting?.value) {
            try {
              const parsed = JSON.parse(configSetting.value);
              if (parsed.sections) setSections(parsed.sections);
              if (parsed.mobileLayout) setMobileLayout(parsed.mobileLayout);
            } catch {
              // Ignore parse errors, use defaults
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...sections];
    const item = list[index];
    list[index] = list[index - 1];
    list[index - 1] = item;
    setSections(list);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const list = [...sections];
    const item = list[index];
    list[index] = list[index + 1];
    list[index + 1] = item;
    setSections(list);
  };

  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const saveLayout = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    const payloadValue = JSON.stringify({
      sections,
      mobileLayout,
      updated_at: new Date().toISOString(),
    });

    try {
      // Find layout setting id first
      const resSettings = await fetch("/api/admin/settings");
      const settingsList = await resSettings.json();
      const layoutRow = Array.isArray(settingsList)
        ? settingsList.find((s: any) => s.key === "homepage_layout_config")
        : null;

      const endpoint = "/api/admin/settings";
      const method = layoutRow ? "PATCH" : "POST";
      const body = layoutRow
        ? { id: layoutRow.id, value: payloadValue }
        : { key: "homepage_layout_config", setting_type: "json", group_name: "ui", value: payloadValue, description: "Dynamic app homepage order and section configurations" };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to persist layout setting");
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving homepage structure");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Homepage visual Builder</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Reorder home sections, hide modules, and modify structural grids. Changes reflect instantly on the mobile app.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveLayout}
            disabled={saving}
            className="rounded-xl bg-teal-600 px-5 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? "Publishing Changes..." : "Publish Live Layout"}
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-850 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Layout published! Mobile application updated successfully without deployment code.
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Visual Reordering Panel */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Layout Section Order</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
              Use reorder arrows to rearrange mobile homepage items. Check or uncheck to show/hide sections instantly.
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${
                  section.visible
                    ? "bg-white border-slate-150 shadow-sm"
                    : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={section.visible}
                    onChange={() => toggleVisibility(section.id)}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-teal-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                      {section.name}
                      {!section.visible && (
                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{section.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveUp(idx)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:bg-slate-50 active:scale-95 disabled:opacity-30 cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={() => moveDown(idx)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:bg-slate-50 active:scale-95 disabled:opacity-30 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Layout Preferences & Mobile Preview */}
        <section className="space-y-5">
          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Mobile Grid Layout</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                Choose the design system grid density for category icons and home directory layouts.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { key: "standard", label: "Standard Hyperlocal Grid (Comfortable)", desc: "Generous margins with title descriptors below icons" },
                { key: "grid_compact", label: "Grid Compact Mode (Premium)", desc: "Tailored to high-resolution devices, dense structures" },
                { key: "minimalist", label: "Minimalist Cards List", desc: "No icons scope, visual carousel strips only" },
              ].map((layout) => (
                <label
                  key={layout.key}
                  className={`flex flex-col p-3 border rounded-2xl cursor-pointer transition-all ${
                    mobileLayout === layout.key
                      ? "bg-teal-50/40 border-teal-500/30 text-teal-900"
                      : "bg-white border-slate-150 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mobileLayout"
                      value={layout.key}
                      checked={mobileLayout === layout.key}
                      onChange={() => setMobileLayout(layout.key as any)}
                      className="h-4 w-4 border-slate-350 text-teal-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-black">{layout.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-450 mt-1 pl-6 leading-relaxed font-semibold">{layout.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Visual Order Simulation</h3>
            <div className="rounded-2xl border border-slate-150 bg-slate-50 p-4 space-y-2 flex flex-col items-center">
              <p className="text-[9px] uppercase font-black tracking-widest text-teal-600 self-start">Interactive Preview</p>
              <div className="w-full max-w-[200px] border-4 border-slate-800 bg-white rounded-[32px] p-3 py-6 shadow-xl relative mt-2">
                <div className="h-4.5 w-16 bg-slate-800 rounded-full mx-auto mb-4 relative" />
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                  {sections
                    .filter((s) => s.visible)
                    .map((s) => (
                      <div key={s.id} className="p-2 border border-slate-100 bg-slate-50 rounded-lg text-[8px] font-black text-center text-slate-500 shadow-sm truncate">
                        {s.name}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
