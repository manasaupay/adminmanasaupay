"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_TABLES, type AdminTableConfig, type AdminTableKey } from "@/lib/admin-tables";

type EditableRow = Record<string, string | boolean>;
type Option = { value: string; label: string };
type OptionMap = Record<string, Option[]>;

const createGroups: { title: string; keys: AdminTableKey[] }[] = [
  { title: "Catalog & Structure", keys: ["categories", "businesses", "services", "products", "auto_drivers"] },
  { title: "Listings & Jobs", keys: ["jobs", "properties", "resale"] },
  { title: "Engagement Content", keys: ["offers", "news", "events", "updates"] },
  { title: "Advertisements", keys: ["ads", "popup_ads", "sponsored_shops"] },
  { title: "Platform Comms", keys: ["notifications", "chat_messages"] },
  { title: "System", keys: ["settings", "likes", "follows"] },
];

function createBlankRow(config: AdminTableConfig): EditableRow {
  const row: EditableRow = {};
  config.columns.forEach((column) => {
    row[column.key] = column.type === "boolean" ? false : "";
  });
  if (config.approveField) row[config.approveField] = false;
  if (config.featuredField) row[config.featuredField] = false;
  if (config.activeField) row[config.activeField] = true;
  if (config.availabilityField) row[config.availabilityField] = true;
  return row;
}

function assignNested(payload: Record<string, unknown>, key: string, value: unknown) {
  const parts = key.split(".");
  const root = parts.shift();
  if (!root) return;
  if (parts.length === 0) {
    payload[root] = value;
    return;
  }
  const existing = payload[root];
  const target =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    const next = cursor[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  });
  payload[root] = target;
}

function preparePayload(config: AdminTableConfig, values: EditableRow) {
  const payload: Record<string, unknown> = {};
  
  // Extract or parse existing meta
  let metaObj: Record<string, unknown> = {};
  if (values['meta']) {
    try {
      metaObj = typeof values['meta'] === 'string'
        ? JSON.parse(values['meta'])
        : (values['meta'] as unknown as Record<string, unknown>);
    } catch {
      // Ignore
    }
  }

  config.columns.forEach((col) => {
    const raw = values[col.key];
    if (raw === undefined || raw === "") return;
    const write = (value: unknown) => {
      if (col.key.includes(".")) assignNested(payload, col.key, value);
      else payload[col.key] = value;
    };
    
    if (col.optionSource === "businesses" && raw === "__manual__") {
      write(null);
      const manualName = values[`${col.key}_manual_name`] || "";
      if (manualName) {
        metaObj.business_name = manualName;
      }
    } else if (col.type === "json") {
      try {
        write(JSON.parse(String(raw)));
      } catch {
        write(String(raw));
      }
    } else if (col.type === "boolean") {
      write(Boolean(raw));
    } else {
      write(raw);
    }
  });

  if (Object.keys(metaObj).length > 0) {
    payload['meta'] = {
      ...((payload['meta'] as Record<string, unknown> | undefined) ?? {}),
      ...metaObj,
    };
  }

  if (config.approveField && values[config.approveField] !== undefined) payload[config.approveField] = values[config.approveField];
  if (config.featuredField && values[config.featuredField] !== undefined) payload[config.featuredField] = values[config.featuredField];
  if (config.activeField && values[config.activeField] !== undefined) payload[config.activeField] = values[config.activeField];
  if (config.availabilityField && values[config.availabilityField] !== undefined) payload[config.availabilityField] = values[config.availabilityField];
  return payload;
}

export function AdminCreateHub() {
  const [selected, setSelected] = useState<AdminTableKey>("categories");
  const [values, setValues] = useState<EditableRow>(() => createBlankRow(ADMIN_TABLES.categories));
  const [options, setOptions] = useState<OptionMap>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const config = ADMIN_TABLES[selected];

  const allKeys = useMemo(() => createGroups.flatMap((group) => group.keys), []);

  useEffect(() => {
    fetch("/api/admin/options")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setOptions(data);
      })
      .catch(() => setOptions({}));
  }, []);

  function optionList(column: AdminTableConfig["columns"][number]) {
    const list = [];
    if (column.optionSource) {
      list.push(...(options[column.optionSource] ?? []));
    } else {
      list.push(...(column.options?.map((option) => ({ value: option, label: option })) ?? []));
    }
    
    if (column.optionSource === "businesses") {
      list.push({ value: "__manual__", label: "✏️ Add Manually (Custom Business Name)" });
    }
    return list;
  }

  async function create() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparePayload(config, values)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create entry");
      setValues(createBlankRow(config));
      setMessage(`${config.title} item successfully injected into database.`);
      
      // Refresh options list
      fetch("/api/admin/options")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setOptions(data);
        })
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create");
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function switchConfig(key: AdminTableKey) {
    setSelected(key);
    setValues(createBlankRow(ADMIN_TABLES[key]));
    setMessage(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Title box */}
      <section className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Console Dynamic Creator</h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          Create new categories, subcategories, directory profiles, campaigns, and settings from a single premium control hub.
        </p>
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        
        {/* Selector Sidebar */}
        <aside className="glass-card rounded-3xl border border-slate-200 bg-white p-4 shadow-sm h-fit">
          {createGroups.map((group) => (
            <div key={group.title} className="mb-5 last:mb-0">
              <p className="px-3.5 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.keys.map((key) => {
                  const active = selected === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => switchConfig(key)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                        active
                          ? "bg-teal-50 text-teal-700 border border-teal-100/60 shadow-sm"
                          : "text-slate-600 border border-transparent hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {ADMIN_TABLES[key].title.replace(" Management", "")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Dynamic Creation Section */}
        <section className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">{config.title} Creator</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">{config.description}</p>
            </div>
            <select
              value={selected}
              onChange={(e) => switchConfig(e.target.value as AdminTableKey)}
              className="w-full sm:w-60 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-teal-600 outline-none transition-all cursor-pointer"
            >
              {allKeys.map((key) => (
                <option key={key} value={key} className="bg-white text-slate-800">
                  {ADMIN_TABLES[key].title}
                </option>
              ))}
            </select>
          </div>

          {/* Explicit Category Guide Card */}
          {selected === "categories" && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 space-y-2">
              <p className="text-xs font-black text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 glow-active shadow-[0_0_8px_rgba(20,184,166,0.2)]" />
                How to Build Categories & Subcategories:
              </p>
              <div className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed font-semibold">
                <p>
                  1. **Parent Category**: Leave the <strong className="text-slate-900">Parent Key</strong> field empty. Set <strong className="text-slate-900">Scope</strong> (e.g. `services` for Local Services, `businesses` for Shops).
                </p>
                <p>
                  2. **Subcategory (Cascading Dropdown item)**: Enter a unique key. In the <strong className="text-slate-900">Parent Key</strong> dropdown list, select your Parent Category. Match the Scope.
                </p>
                <p className="text-slate-500 font-medium">
                  Once created, they will immediately show up inside the **Create Partner Login** wizard cascading select menus!
                </p>
              </div>
            </div>
          )}

          {/* Render inputs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {config.columns.map((column) => (
              <label key={column.key} className="block space-y-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  {column.label}
                </span>
                {((column.type === "enum" && column.options) || column.optionSource) ? (
                  <div className="space-y-2">
                    <select
                      value={String(values[column.key] ?? "")}
                      onChange={(e) => update(column.key, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500/40 outline-none transition-all cursor-pointer"
                    >
                      <option value="" className="text-slate-400">-- Choose --</option>
                      {optionList(column).map((option) => (
                        <option key={option.value} value={option.value} className="bg-white text-slate-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {column.optionSource === "businesses" && values[column.key] === "__manual__" && (
                      <input
                        type="text"
                        value={String(values[`${column.key}_manual_name`] ?? "")}
                        onChange={(e) => update(`${column.key}_manual_name`, e.target.value)}
                        placeholder="Enter Custom Business Name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none transition-all animate-fade-in"
                      />
                    )}
                  </div>
                ) : column.type === "boolean" ? (
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={Boolean(values[column.key])}
                      onChange={(e) => update(column.key, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-200 bg-white text-teal-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                ) : column.type === "json" ? (
                  <textarea
                    value={String(values[column.key] ?? "")}
                    onChange={(e) => update(column.key, e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none transition-all"
                  />
                ) : (
                  <input
                    type={column.type === "date" ? "date" : "text"}
                    value={String(values[column.key] ?? "")}
                    onChange={(e) => update(column.key, e.target.value)}
                    placeholder={`Enter ${column.label}`}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none transition-all"
                  />
                )}
              </label>
            ))}

            {/* Special boolean switches */}
            {config.approveField && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.approveField])}
                  onChange={(e) => update(config.approveField!, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 bg-white text-teal-500 focus:ring-0 cursor-pointer"
                />
                Auto-Approved
              </label>
            )}
            {config.featuredField && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.featuredField])}
                  onChange={(e) => update(config.featuredField!, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 bg-white text-teal-500 focus:ring-0 cursor-pointer"
                />
                Featured Listing
              </label>
            )}
            {config.activeField && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.activeField])}
                  onChange={(e) => update(config.activeField!, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 bg-white text-teal-500 focus:ring-0 cursor-pointer"
                />
                Active Creative
              </label>
            )}
            {config.availabilityField && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.availabilityField])}
                  onChange={(e) => update(config.availabilityField!, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 bg-white text-teal-500 focus:ring-0 cursor-pointer"
                />
                Available for Bookings
              </label>
            )}
          </div>

          {/* Footer Submit area */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={saving}
              onClick={create}
              className="rounded-xl bg-teal-600 px-6 py-3 text-xs font-black tracking-wide text-white hover:bg-teal-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 shadow-sm cursor-pointer"
            >
              {saving ? "Creating Entry..." : `Add ${config.title.replace(" Management", "")}`}
            </button>
            {message && (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {message}
              </p>
            )}
            {error && (
              <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
