"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminTableConfig } from "@/lib/admin-tables";
import { SendNotificationButton } from "./send-notification-button";

type Row = Record<string, unknown>;
type EditableRow = Record<string, string | boolean>;

function createBlankRow(config: AdminTableConfig): EditableRow {
  const row: EditableRow = {};
  config.columns.forEach((column) => {
    row[column.key] = "";
  });
  if (config.approveField) row[config.approveField] = false;
  if (config.featuredField) row[config.featuredField] = false;
  if (config.activeField) row[config.activeField] = false;
  if (config.availabilityField) row[config.availabilityField] = false;
  return row;
}

function createEditableRow(config: AdminTableConfig, row: Row): EditableRow {
  const editable: EditableRow = {};
  config.columns.forEach((column) => {
    const value = row[column.key];
    editable[column.key] = value === null || value === undefined ? "" : String(value);
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
  const [newRow, setNewRow] = useState<EditableRow>(() => createBlankRow(config));

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
    load();
  }, [load]);

  useEffect(() => {
    setNewRow(createBlankRow(config));
  }, [config]);

  async function patch(id: string, updates: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/admin/${config.key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    setSaving(true);
    await fetch(`/api/admin/${config.key}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSaving(false);
    load();
  }

  async function create(values: EditableRow) {
    setSaving(true);
    await fetch(`/api/admin/${config.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    load();
    setNewRow(createBlankRow(config));
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

  function updateNewRowValue(key: string, value: string | boolean) {
    setNewRow((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function formatValue(value: unknown) {
    return value === null || value === undefined ? "" : String(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
          <p className="mt-1 text-slate-600">{config.description}</p>
        </div>
        <SendNotificationButton section={config.sectionKey} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Add new row</h2>
            <p className="text-sm text-slate-500">Fill fields and click Add.</p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => create(newRow)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add row
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {config.columns.map((column) => (
            <label key={column.key} className="block text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column.label}
              </span>
              <input
                type="text"
                value={String(newRow[column.key] ?? "")}
                onChange={(e) => updateNewRowValue(column.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          ))}
          {config.approveField && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(newRow[config.approveField])}
                onChange={(e) => updateNewRowValue(config.approveField!, e.target.checked)}
              />
              Approve row
            </label>
          )}
          {config.featuredField && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(newRow[config.featuredField])}
                onChange={(e) => updateNewRowValue(config.featuredField!, e.target.checked)}
              />
              Featured
            </label>
          )}
          {config.activeField && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(newRow[config.activeField])}
                onChange={(e) => updateNewRowValue(config.activeField!, e.target.checked)}
              />
              Active
            </label>
          )}
          {config.availabilityField && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(newRow[config.availabilityField])}
                onChange={(e) => updateNewRowValue(config.availabilityField!, e.target.checked)}
              />
              Available
            </label>
          )}
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
              {rows.map((row) => {
                const id = String(row.id);
                const editable = editingRows[id] ?? createEditableRow(config, row);
                return (
                  <tr key={id} className="border-b last:border-0">
                    {config.columns.map((c) => (
                      <td key={c.key} className="max-w-xs truncate px-4 py-3">
                        <input
                          type="text"
                          value={formatValue(editable[c.key])}
                          onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
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
              No records yet. Add rows in Supabase Table Editor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
