"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const audiences = [
  "all",
  "businesses",
  "service_providers",
  "auto_drivers",
  "selected",
] as const;

type Audience = (typeof audiences)[number];

type SendResult = {
  sent?: number;
  failed?: number;
  message?: string;
  error?: string;
};

function NotificationsForm() {
  const params = useSearchParams();
  const section = params.get("section");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [deepLink, setDeepLink] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          image,
          audience,
          deep_link: deepLink,
          target_meta:
            audience === "selected"
              ? {
                  user_ids: selectedUserIds
                    .split(",")
                    .map((id) => id.trim())
                    .filter(Boolean),
                }
              : {},
        }),
      });
      const data = (await response.json()) as SendResult;
      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Send failed",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Send Notification</h1>
        {section && (
          <p className="text-sm text-teal-700">From section: {section}</p>
        )}
      </div>

      <form
        onSubmit={sendNotification}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Notification title"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Message</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            rows={4}
            placeholder="Notification message"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Image URL</label>
          <input
            type="url"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Audience</label>
          <select
            value={audience}
            onChange={(event) => setAudience(event.target.value as Audience)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {audiences.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        {audience === "selected" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              User IDs
            </label>
            <textarea
              value={selectedUserIds}
              onChange={(event) => setSelectedUserIds(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={3}
              placeholder="Comma separated Supabase user IDs"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Deep link URL</label>
          <input
            type="url"
            value={deepLink}
            onChange={(event) => setDeepLink(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="https://manasaupay.vercel.app/business/12"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {busy ? "Sending..." : "Send FCM Notification"}
        </button>
        {result && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              result.error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {result.error
              ? result.error
              : result.message ?? `Sent: ${result.sent ?? 0}, Failed: ${result.failed ?? 0}`}
          </div>
        )}
      </form>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <NotificationsForm />
    </Suspense>
  );
}
