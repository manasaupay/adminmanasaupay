"use client";

import React, { useState, useEffect } from "react";

type Rule = {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
  desc: string;
  runs: number;
};

type SettingsRow = {
  id: string;
  key?: string;
  value?: string;
};

export default function AutomationEnginePage() {
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", trigger: "IF Shop Approved", action: "THEN Blast Dynamic Notification", active: true, desc: "Sends custom push alerts to all app users immediately upon vendor verification approval.", runs: 42 },
    { id: "2", trigger: "IF Ad Expires", action: "THEN Disable Placement Target", active: true, desc: "Monitors expired banners every 1 hour and pulls them from rendering blocks.", runs: 124 },
    { id: "3", trigger: "IF Event Published", action: "THEN Boost to Homepage Builders", active: false, desc: "Pins upcoming local cultural events to homepage carousels automatically on submission.", runs: 0 },
    { id: "4", trigger: "IF Rental Property Listed", action: "THEN Notify Rentals Followers", active: true, desc: "Fires personalized deep links to active category follows when a new flat is listed.", runs: 8 },
  ]);

  const [form, setForm] = useState({
    trigger: "IF Shop Approved",
    action: "THEN Blast Dynamic Notification",
    desc: "",
  });

  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load automation rules from Supabase Settings if available
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const configSetting = (data as SettingsRow[]).find((s) => s.key === "automation_rules_config");
          if (configSetting?.value) {
            try {
              const parsed = JSON.parse(configSetting.value);
              if (Array.isArray(parsed)) setRules(parsed);
            } catch {
              // Ignore parse errors, use defaults
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const saveRules = async (updatedRules: Rule[]) => {
    setSaving(true);
    try {
      const resSettings = await fetch("/api/admin/settings");
      const settingsList = await resSettings.json();
      const ruleRow = Array.isArray(settingsList)
        ? (settingsList as SettingsRow[]).find((s) => s.key === "automation_rules_config")
        : null;

      const payloadValue = JSON.stringify(updatedRules);
      const method = ruleRow ? "PATCH" : "POST";
      const body = ruleRow
        ? { id: ruleRow.id, value: payloadValue }
        : { key: "automation_rules_config", setting_type: "json", group_name: "features", value: payloadValue, description: "Active dynamic fcm and indexing automations" };

      await fetch("/api/admin/settings", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // Gracefully continue
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: Rule = {
      id: Date.now().toString(),
      trigger: form.trigger,
      action: form.action,
      active: true,
      desc: form.desc || `Custom trigger rule scheduled to run ${form.action.toLowerCase()} on trigger ${form.trigger.toLowerCase()}.`,
      runs: 0,
    };

    const newRules = [newRule, ...rules];
    setRules(newRules);
    void saveRules(newRules);

    setForm({ trigger: "IF Shop Approved", action: "THEN Blast Dynamic Notification", desc: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const toggleRule = (id: string) => {
    const nextRules = rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    setRules(nextRules);
    void saveRules(nextRules);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Automation Engine</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Define dynamic no-code operational rules. Trigger push notifications, re-order listings, and expire campaigns automatically.
          </p>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Automation trigger rule added to the operations catalog!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Rules List */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 lg:col-span-2 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-slate-900">Active Triggers Catalog</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">Rules executed dynamically inside Next/Supabase handlers.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
              Active: {rules.filter(r => r.active).length}
            </span>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 border rounded-2xl transition-all ${
                  rule.active
                    ? "bg-white border-slate-150 shadow-sm"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-150">
                        {rule.trigger}
                      </span>
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-150">
                        {rule.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{rule.desc}</p>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                      Executed: {rule.runs} times
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        rule.active
                          ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                          : "bg-white text-slate-500 border-slate-250 hover:bg-slate-50"
                      }`}
                    >
                      {rule.active ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Create Rule Builder Form */}
        <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">No-Code rule Builder</h3>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
              Build an automated trigger by selecting conditions (IF) and actions (THEN).
            </p>
          </div>

          <form onSubmit={handleCreateRule} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Trigger Condition (IF)</label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="IF Shop Approved">IF business listing verified & approved</option>
                <option value="IF Ad Expires">IF banner expiry date lapses</option>
                <option value="IF Event Published">IF user posts upcoming cultural event</option>
                <option value="IF Rental Property Listed">IF fresh real estate plot listed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Target Action (THEN)</label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs text-slate-700 outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="THEN Blast Dynamic Notification">Blast automated push alert</option>
                <option value="THEN Disable Placement Target">Pull from slider carousel</option>
                <option value="THEN Boost to Homepage Builders">Pin directly on Visual Builder</option>
                <option value="THEN Notify Rentals Followers">Trigger targeted follows emails</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Rule Description</label>
              <textarea
                rows={2}
                placeholder="Describe rule context..."
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-teal-600 px-4 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md mt-1"
            >
              {saving ? "Syncing engine..." : "🚀 Load trigger rule into engine"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
