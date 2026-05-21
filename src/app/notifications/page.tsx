"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const audiences = [
  "all",
  "businesses",
  "service_providers",
  "auto_drivers",
  "selected",
] as const;

function NotificationsForm() {
  const params = useSearchParams();
  const section = params.get("section");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Send Notification</h1>
        {section && (
          <p className="text-sm text-teal-700">From section: {section}</p>
        )}
      </div>

      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Notification title"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Message</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={4}
            placeholder="Notification message"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Image URL</label>
          <input
            type="url"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Audience</label>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {audiences.map((a) => (
              <option key={a} value={a}>
                {a.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Deep link URL</label>
          <input
            type="url"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="https://manasaupay.vercel.app/business/12"
          />
        </div>
        <button
          type="button"
          className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800"
        >
          Send (wire to FCM API)
        </button>
      </form>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
      <NotificationsForm />
    </Suspense>
  );
}
