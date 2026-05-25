"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_TABLES, type AdminTableConfig, type AdminTableKey } from "@/lib/admin-tables";

type EditableRow = Record<string, string | boolean>;
type Option = { value: string; label: string };
type OptionMap = Record<string, Option[]>;

const createGroups: { title: string; keys: AdminTableKey[] }[] = [
  { title: "Catalog", keys: ["categories", "businesses", "services", "auto_drivers"] },
  { title: "Listings", keys: ["jobs", "properties", "resale"] },
  { title: "Content", keys: ["offers", "news", "events", "updates"] },
  { title: "Ads", keys: ["ads", "popup_ads", "sponsored_shops"] },
  { title: "Comms", keys: ["notifications", "chat_messages"] },
  { title: "Platform", keys: ["settings"] },
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

function preparePayload(config: AdminTableConfig, values: EditableRow) {
  const payload: Record<string, unknown> = {};
  config.columns.forEach((col) => {
    const raw = values[col.key];
    if (raw === undefined || raw === "") return;
    if (col.type === "json") {
      try {
        payload[col.key] = JSON.parse(String(raw));
      } catch {
        payload[col.key] = String(raw);
      }
    } else if (col.type === "boolean") {
      payload[col.key] = Boolean(raw);
    } else {
      payload[col.key] = raw;
    }
  });
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
    if (column.optionSource) return options[column.optionSource] ?? [];
    return column.options?.map((option) => ({ value: option, label: option })) ?? [];
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
      if (!res.ok) throw new Error(data.error ?? "Could not create");
      setValues(createBlankRow(config));
      setMessage(`${config.title} item created.`);
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
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Add New</h1>
        <p className="mt-1 text-slate-600">
          Create new categories, subcategories, listings, ads, content, and settings from one place.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          {createGroups.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.keys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => switchConfig(key)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                      selected === key
                        ? "bg-teal-700 text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {ADMIN_TABLES[key].title.replace(" Management", "")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{config.title}</h2>
              <p className="text-sm text-slate-600">{config.description}</p>
            </div>
            <select
              value={selected}
              onChange={(e) => switchConfig(e.target.value as AdminTableKey)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {allKeys.map((key) => (
                <option key={key} value={key}>
                  {ADMIN_TABLES[key].title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {config.columns.map((column) => (
              <label key={column.key} className="block text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {column.label}
                </span>
                {((column.type === "enum" && column.options) || column.optionSource) ? (
                  <select
                    value={String(values[column.key] ?? "")}
                    onChange={(e) => update(column.key, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">Select</option>
                    {optionList(column).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : column.type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(values[column.key])}
                    onChange={(e) => update(column.key, e.target.checked)}
                    className="mt-3"
                  />
                ) : column.type === "json" ? (
                  <textarea
                    value={String(values[column.key] ?? "")}
                    onChange={(e) => update(column.key, e.target.value)}
                    className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                ) : (
                  <input
                    type={column.type === "date" ? "date" : "text"}
                    value={String(values[column.key] ?? "")}
                    onChange={(e) => update(column.key, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                )}
              </label>
            ))}
            {config.approveField && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.approveField])}
                  onChange={(e) => update(config.approveField!, e.target.checked)}
                />
                Approved
              </label>
            )}
            {config.featuredField && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.featuredField])}
                  onChange={(e) => update(config.featuredField!, e.target.checked)}
                />
                Featured
              </label>
            )}
            {config.activeField && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.activeField])}
                  onChange={(e) => update(config.activeField!, e.target.checked)}
                />
                Active
              </label>
            )}
            {config.availabilityField && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(values[config.availabilityField])}
                  onChange={(e) => update(config.availabilityField!, e.target.checked)}
                />
                Available
              </label>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={create}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create"}
            </button>
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
