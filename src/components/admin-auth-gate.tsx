"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { SUPPORT_EMAIL } from "@/lib/constants";

type AuthState = "checking" | "signed_out" | "otp_sent" | "signed_in";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<AuthState>("checking");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      const email = session?.user.email?.toLowerCase();
      if (session?.access_token && email === SUPPORT_EMAIL) {
        installAuthFetch(session.access_token);
        setState("signed_in");
      } else {
        setState("signed_out");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email?.toLowerCase();
      if (session?.access_token && email === SUPPORT_EMAIL) {
        installAuthFetch(session.access_token);
        setState("signed_in");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendOtp() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: SUPPORT_EMAIL,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setState("otp_sent");
    setMessage("OTP sent. Please check the admin inbox.");
  }

  async function verifyOtp() {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.verifyOtp({
      email: SUPPORT_EMAIL,
      token,
      type: "email",
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session?.access_token) installAuthFetch(data.session.access_token);
    setState("signed_in");
  }

  if (state === "signed_in") return children;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">Secure Admin</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Manasa Upay Console</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Admin access is protected with a Supabase one-time email code.
        </p>

        <div className="mt-6 space-y-3">
          {state === "otp_sent" && (
            <input
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              placeholder="Enter OTP"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-black tracking-[0.3em] text-slate-900 outline-none focus:border-teal-500"
            />
          )}
          <button
            type="button"
            disabled={busy || state === "checking"}
            onClick={state === "otp_sent" ? verifyOtp : sendOtp}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {state === "checking" ? "Checking..." : busy ? "Please wait..." : state === "otp_sent" ? "Verify OTP" : "Send Email OTP"}
          </button>
        </div>

        {message && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

function installAuthFetch(accessToken: string) {
  const win = window as typeof window & { __adminFetchPatched?: boolean };
  if (win.__adminFetchPatched) return;
  win.__adminFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith("/api/")) {
      const headers = new Headers(init.headers);
      headers.set("authorization", `Bearer ${accessToken}`);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}
