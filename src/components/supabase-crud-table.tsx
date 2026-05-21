"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminTableConfig } from "@/lib/admin-tables";
import { SendNotificationButton } from "./send-notification-button";

type Row = Record<string, unknown>;

export function SupabaseCrudTable({ config }: { config: AdminTableConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${config.key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.key]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, updates: Record<string, unknown>) {
    await fetch(`/api/admin/${config.key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    load();
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Supabase error</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs">
            Check <code>.env.local</code>: URL must be{" "}
            <code>https://pgnnvnjuxmflshgshcni.supabase.co</code> and include{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>. Run migration SQL in Supabase.
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
                {config.approveField && <th className="px-4 py-3">Approved</th>}
                {config.featuredField && <th className="px-4 py-3">Featured</th>}
                {config.activeField && <th className="px-4 py-3">Active</th>}
                {config.availabilityField && (
                  <th className="px-4 py-3">Available</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)} className="border-b last:border-0">
                  {config.columns.map((c) => (
                    <td key={c.key} className="max-w-xs truncate px-4 py-3">
                      {String(row[c.key] ?? "—")}
                    </td>
                  ))}
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
              ))}
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
