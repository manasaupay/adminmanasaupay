"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminTableConfig } from "@/lib/admin-tables";
import { SendNotificationButton } from "./send-notification-button";

type Row = Record<string, unknown>;
type EditableRow = Record<string, string | boolean>;
type Option = { value: string; label: string };
type OptionMap = Record<string, Option[]>;

function createEditableRow(config: AdminTableConfig, row: Row): EditableRow {
  const editable: EditableRow = {};
  config.columns.forEach((column) => {
    const value = row[column.key];
    if (column.type === "date") {
      editable[column.key] = value === null || value === undefined ? "" : String(value).slice(0, 10);
    } else if (column.type === "json") {
      try {
        editable[column.key] = value === null || value === undefined ? "" : JSON.stringify(value);
      } catch {
        editable[column.key] = value === null || value === undefined ? "" : String(value);
      }
    } else if (column.type === "boolean") {
      editable[column.key] = Boolean(value);
    } else {
      editable[column.key] = value === null || value === undefined ? "" : String(value);
    }
  });
  if (config.approveField) editable[config.approveField] = Boolean(row[config.approveField]);
  if (config.featuredField) editable[config.featuredField] = Boolean(row[config.featuredField]);
  if (config.activeField) editable[config.activeField] = Boolean(row[config.activeField]);
  if (config.availabilityField) editable[config.availabilityField] = Boolean(row[config.availabilityField]);
  return editable;
}

export function SupabaseCrudTable({ config }: { config: AdminTableConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<string, EditableRow>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "active">("all");
  const [dynamicOptions, setDynamicOptions] = useState<OptionMap>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${config.key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(Array.isArray(data) ? data : []);
      const editingMap: Record<string, EditableRow> = {};
      (Array.isArray(data) ? data : []).forEach((row: Row) => {
        if (row.id === undefined || row.id === null) return;
        editingMap[String(row.id)] = createEditableRow(config, row);
      });
      setEditingRows(editingMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
      setEditingRows({});
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/options")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setDynamicOptions(data);
      })
      .catch(() => setDynamicOptions({}));
  }, []);

  async function patch(id: string, updates: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const payload = preparePayload(updates as EditableRow);
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete row");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function updateRowValue(id: string, key: string, value: string | boolean) {
    setEditingRows((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value,
      },
    }));
  }

  function formatValue(value: unknown) {
    return value === null || value === undefined ? "" : String(value);
  }

  function optionsFor(column: AdminTableConfig["columns"][number]) {
    if (column.optionSource) return dynamicOptions[column.optionSource] ?? [];
    return column.options?.map((option) => ({ value: option, label: option })) ?? [];
  }

  function preparePayload(values: EditableRow): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    config.columns.forEach((col) => {
      const raw = values[col.key];
      if (raw === undefined) return;
      if (raw === "") return;
      if (col.type === "json") {
        try {
          payload[col.key] = JSON.parse(String(raw));
        } catch {
          payload[col.key] = String(raw);
        }
      } else if (col.type === "date") {
        payload[col.key] = String(raw);
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

  const visibleRows = rows.filter((row) => {
    const matchesQuery =
      query.trim() === "" ||
      JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (statusFilter === "pending" && config.approveField) {
      return row[config.approveField] === false;
    }
    if (statusFilter === "approved" && config.approveField) {
      return row[config.approveField] === true;
    }
    if (statusFilter === "active" && config.activeField) {
      return row[config.activeField] === true;
    }
    return true;
  });

  const pendingCount = config.approveField
    ? rows.filter((row) => row[config.approveField!] === false).length
    : 0;
  const approvedCount = config.approveField
    ? rows.filter((row) => row[config.approveField!] === true).length
    : 0;
  const activeCount = config.activeField
    ? rows.filter((row) => row[config.activeField!] === true).length
    : rows.length;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{config.title}</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">{config.description}</p>
          </div>
          <div className="shrink-0">
            <SendNotificationButton section={config.sectionKey} />
          </div>
        </div>

        {/* Local metrics sub-block */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Entries</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.approveField ? "Pending Approval" : "Active In-app"}
            </p>
            <p className="mt-1 text-2xl font-black text-amber-600">
              {config.approveField ? pendingCount : activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.approveField ? "Approved" : "Showing Filtered"}
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-600">
              {config.approveField ? approvedCount : visibleRows.length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm">
          <p className="font-extrabold flex items-center gap-1.5">
            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Supabase Connection Issue
          </p>
          <p className="mt-1.5 leading-relaxed">{error}</p>
          <p className="mt-2 text-[10px] text-slate-400 font-bold">
            Verify credentials in .env.local: SUPABASE_SERVICE_ROLE_KEY & tables migrations.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 p-6 justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-500 glow-active shadow-[0_0_8px_rgba(20,184,166,0.3)]" />
          <p className="text-xs font-bold text-slate-500 tracking-wide">Syncing entries with Supabase...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Table Header Filter controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div className="flex-1 relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${config.title.toLowerCase()}...`}
                className="w-full sm:max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "active"] as const).map((filter) => {
                if ((filter === "pending" || filter === "approved") && !config.approveField) return null;
                if (filter === "active" && !config.activeField) return null;
                const active = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-lg px-3.5 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-teal-600 text-white shadow-sm"
                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <table className="min-w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key} className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">
                    {c.label}
                  </th>
                ))}
                <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Actions</th>
                {config.approveField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Approved</th>}
                {config.featuredField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Featured</th>}
                {config.activeField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Active</th>}
                {config.availabilityField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Available</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const id = String(row.id);
                const editable = editingRows[id] ?? createEditableRow(config, row);
                return (
                  <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/20 transition-colors">
                    {config.columns.map((c) => (
                      <td key={c.key} className="max-w-xs truncate px-5 py-3">
                        {(c.type === "enum" && c.options) || c.optionSource ? (
                          <select
                            value={String(editable[c.key] ?? "")}
                            onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500/40 cursor-pointer"
                          >
                            <option value="" className="text-slate-400">— select —</option>
                            {optionsFor(c).map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : c.type === "boolean" ? (
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={Boolean(editable[c.key])}
                              onChange={(e) => updateRowValue(id, c.key, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-200 bg-white text-teal-600 focus:ring-0 cursor-pointer"
                            />
                          </div>
                        ) : c.type === "date" ? (
                          <input
                            type="date"
                            value={String(editable[c.key] ?? "")}
                            onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40"
                          />
                        ) : c.type === "json" ? (
                          <textarea
                            value={String(editable[c.key] ?? "")}
                            onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40"
                            rows={1}
                          />
                        ) : c.type === "image" ? (
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={String(editable[c.key] ?? "")}
                            onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40 placeholder-slate-400"
                          />
                        ) : (
                          <input
                            type="text"
                            value={formatValue(editable[c.key])}
                            onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40 placeholder-slate-400"
                          />
                        )}
                      </td>
                    ))}
                    
                    {/* Operations save/delete buttons */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => patch(id, editable)}
                          className="rounded-lg bg-teal-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-teal-700 border border-teal-200 hover:bg-teal-100 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            if (confirm("Permanently delete this entry?")) remove(id);
                          }}
                          className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-100 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                    {/* Operational switches */}
                    {config.approveField && (
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.approveField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.approveField!]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-200 bg-white text-teal-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {config.featuredField && (
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.featuredField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.featuredField!]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-200 bg-white text-teal-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {config.activeField && (
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.activeField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.activeField!]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-200 bg-white text-teal-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {config.availabilityField && (
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.availabilityField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.availabilityField!]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-200 bg-white text-teal-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && !error && (
            <p className="p-12 text-center text-xs font-bold text-slate-400">
              No entries found. Click "Add New" or use User Setup wizards to inject records.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
