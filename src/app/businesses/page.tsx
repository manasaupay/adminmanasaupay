"use client";

import { useCallback, useEffect, useState } from "react";
import { SendNotificationButton } from "@/components/send-notification-button";

type Business = {
  id: string;
  name: string;
  category: string;
  phone: string;
  is_approved: boolean;
  is_featured: boolean;
};

export default function BusinessesPage() {
  const [rows, setRows] = useState<Business[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(id: string, field: "is_approved" | "is_featured", value: boolean) {
    await fetch("/api/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Management</h1>
          <p className="mt-1 text-slate-600">Approve, feature, and manage shop listings.</p>
        </div>
        <SendNotificationButton section="businesses" />
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}. Check <code>.env.local</code> and Supabase service role key.
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3">Featured</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.category}</td>
                  <td className="px-4 py-3">{b.phone}</td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={b.is_approved}
                      onChange={(e) =>
                        toggle(b.id, "is_approved", e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={b.is_featured}
                      onChange={(e) =>
                        toggle(b.id, "is_featured", e.target.checked)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !error && (
            <p className="p-6 text-center text-slate-500">No businesses yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
