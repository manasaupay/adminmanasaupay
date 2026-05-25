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
    // include special fields (booleans managed outside columns)
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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
            <p className="mt-1 text-slate-600">{config.description}</p>
          </div>
          <SendNotificationButton section={config.sectionKey} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {config.approveField ? "Pending" : "Active"}
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {config.approveField ? pendingCount : activeCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {config.approveField ? "Approved" : "Showing"}
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {config.approveField ? approvedCount : visibleRows.length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Supabase error</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs">
            Check <code>.env.local</code>: URL must be <code>https://pgnnvnjuxmflshgshcni.supabase.co</code> and include <code>SUPABASE_SERVICE_ROLE_KEY</code>. Run migration SQL in Supabase.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading from Supabase…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}`}
              className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "active"] as const).map((filter) => {
                if ((filter === "pending" || filter === "approved") && !config.approveField) return null;
                if (filter === "active" && !config.activeField) return null;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                      statusFilter === filter
                        ? "bg-teal-700 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3">Actions</th>
                {config.approveField && <th className="px-4 py-3">Approved</th>}
                {config.featuredField && <th className="px-4 py-3">Featured</th>}
                {config.activeField && <th className="px-4 py-3">Active</th>}
                {config.availabilityField && <th className="px-4 py-3">Available</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const id = String(row.id);
                const editable = editingRows[id] ?? createEditableRow(config, row);
                return (
                  <tr key={id} className="border-b last:border-0">
                    {config.columns.map((c) => (
                      <td key={c.key} className="max-w-xs truncate px-4 py-3">
                            {(c.type === "enum" && c.options) || c.optionSource ? (
                              <select
                                value={String(editable[c.key] ?? "")}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              >
                                <option value="">— select —</option>
                                {optionsFor(c).map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : c.type === "boolean" ? (
                              <input
                                type="checkbox"
                                checked={Boolean(editable[c.key])}
                                onChange={(e) => updateRowValue(id, c.key, e.target.checked)}
                              />
                            ) : c.type === "date" ? (
                              <input
                                type="date"
                                value={String(editable[c.key] ?? "")}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              />
                            ) : c.type === "json" ? (
                              <textarea
                                value={String(editable[c.key] ?? "")}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              />
                            ) : c.type === "image" ? (
                              <input
                                type="text"
                                placeholder="Image URL"
                                value={String(editable[c.key] ?? "")}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              />
                            ) : (
                              <input
                                type="text"
                                value={formatValue(editable[c.key])}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              />
                            )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => patch(id, editable)}
                          className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            if (confirm("Delete this row?")) remove(id);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    {config.approveField && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.approveField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.approveField!]: e.target.checked,
                            })
                          }
                        />
                      </td>
                    )}
                    {config.featuredField && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.featuredField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.featuredField!]: e.target.checked,
                            })
                          }
                        />
                      </td>
                    )}
                    {config.activeField && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.activeField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.activeField!]: e.target.checked,
                            })
                          }
                        />
                      </td>
                    )}
                    {config.availabilityField && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(row[config.availabilityField])}
                          onChange={(e) =>
                            patch(String(row.id), {
                              [config.availabilityField!]: e.target.checked,
                            })
                          }
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && !error && (
            <p className="p-6 text-center text-slate-500">
              No records yet. Use Add New to create the first item.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
