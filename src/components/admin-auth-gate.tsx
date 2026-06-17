"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { SUPPORT_EMAIL } from "@/lib/constants";

type AuthState = "checking" | "signed_out" | "otp_sent" | "signed_in";

const ADMIN_OTP_LENGTH = 8;
const ADMIN_SESSION_MS = 60 * 60 * 1000;
const OTP_RESEND_MS = 30 * 1000;
const AUTH_TIMEOUT_MS = 20 * 1000;
const ADMIN_LOGIN_AT_KEY = "manasa_admin_login_at";
const ADMIN_OTP_SENT_AT_KEY = "manasa_admin_otp_sent_at";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<AuthState>("checking");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      const email = session?.user.email?.toLowerCase();
      if (session?.access_token && email === SUPPORT_EMAIL) {
        if (isAdminSessionExpired()) {
          clearAdminSession();
          supabase.auth.signOut();
          setState("signed_out");
          setMessage("Admin session expired. Please login again.");
          return;
        }
        ensureAdminLoginStarted();
        installAuthFetch(session.access_token);
        setState("signed_in");
      } else {
        setState("signed_out");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email?.toLowerCase();
      if (session?.access_token && email === SUPPORT_EMAIL) {
        if (isAdminSessionExpired()) {
          clearAdminSession();
          supabase.auth.signOut();
          setState("signed_out");
          setMessage("Admin session expired. Please login again.");
          return;
        }
        ensureAdminLoginStarted();
        installAuthFetch(session.access_token);
        setState("signed_in");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (state === "signed_in" && isAdminSessionExpired(nextNow)) {
        clearAdminSession();
        supabase.auth.signOut();
        setState("signed_out");
        setMessage("Admin session expired. Please login again.");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state, supabase]);

  async function sendOtp() {
    const lastSentAt = getStoredTime(ADMIN_OTP_SENT_AT_KEY);
    if (lastSentAt && Date.now() - lastSentAt < OTP_RESEND_MS) {
      setState("otp_sent");
      setMessage(
        `OTP already sent. Please use the ${ADMIN_OTP_LENGTH}-digit code from email or try again in ${formatRemaining(
          OTP_RESEND_MS - (Date.now() - lastSentAt),
        )}.`,
      );
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: SUPPORT_EMAIL,
          options: {
            shouldCreateUser: false,
          },
        }),
      );
      if (error) {
        setMessage(error.message);
        return;
      }
      window.localStorage.setItem(ADMIN_OTP_SENT_AT_KEY, String(Date.now()));
      setState("otp_sent");
      setMessage(
        `Verification code sent. Please enter the ${ADMIN_OTP_LENGTH}-digit code.`,
      );
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (token.length !== ADMIN_OTP_LENGTH) {
      setMessage(`Please enter the full ${ADMIN_OTP_LENGTH}-digit OTP.`);
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({
          email: SUPPORT_EMAIL,
          token,
          type: "email",
        }),
      );
      if (error) {
        setMessage(error.message);
        return;
      }
      window.localStorage.setItem(ADMIN_LOGIN_AT_KEY, String(Date.now()));
      window.localStorage.removeItem(ADMIN_OTP_SENT_AT_KEY);
      if (data.session?.access_token) installAuthFetch(data.session.access_token);
      setState("signed_in");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (state === "signed_in") return children;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
          Secure Admin
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Manasa Upay Console
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Admin access is protected with a secure one-time verification code.
        </p>

        <div className="mt-6 space-y-3">
          {state === "otp_sent" && (
            <input
              value={token}
              onChange={(event) =>
                setToken(
                  event.target.value.replace(/\D/g, "").slice(0, ADMIN_OTP_LENGTH),
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={`Enter ${ADMIN_OTP_LENGTH}-digit OTP`}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-black tracking-[0.3em] text-slate-900 outline-none focus:border-teal-500"
            />
          )}
          <button
            type="button"
            disabled={busy || state === "checking"}
            onClick={state === "otp_sent" ? verifyOtp : sendOtp}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {state === "checking"
              ? "Checking..."
              : busy
                ? "Please wait..."
                : state === "otp_sent"
                  ? "Verify OTP"
                  : "Send Email OTP"}
          </button>
          {state === "otp_sent" && (
            <button
              type="button"
              disabled={busy || getOtpResendRemaining(now) > 0}
              onClick={sendOtp}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:opacity-50"
            >
              {getOtpResendRemaining(now) > 0
                ? `Resend in ${formatRemaining(getOtpResendRemaining(now))}`
                : "Resend OTP"}
            </button>
          )}
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

function getStoredTime(key: string) {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) ? value : 0;
}

function ensureAdminLoginStarted() {
  if (!getStoredTime(ADMIN_LOGIN_AT_KEY)) {
    window.localStorage.setItem(ADMIN_LOGIN_AT_KEY, String(Date.now()));
  }
}

function isAdminSessionExpired(now = Date.now()) {
  const loginAt = getStoredTime(ADMIN_LOGIN_AT_KEY);
  return Boolean(loginAt && now - loginAt >= ADMIN_SESSION_MS);
}

function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_LOGIN_AT_KEY);
  window.localStorage.removeItem(ADMIN_OTP_SENT_AT_KEY);
  installAuthFetch("");
}

function getOtpResendRemaining(now: number) {
  const lastSentAt = getStoredTime(ADMIN_OTP_SENT_AT_KEY);
  if (!lastSentAt) return 0;
  return Math.max(0, OTP_RESEND_MS - (now - lastSentAt));
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function withTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(
          new Error(
            "Auth request timed out. Please check internet/Supabase settings and try again.",
          ),
        );
      }, AUTH_TIMEOUT_MS);
    }),
  ]);
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to send OTP. Please try again.";
}

function installAuthFetch(accessToken: string) {
  const win = window as typeof window & {
    __adminFetchPatched?: boolean;
    __adminAccessToken?: string;
    __adminOriginalFetch?: typeof window.fetch;
  };
  win.__adminAccessToken = accessToken;
  if (win.__adminFetchPatched) return;
  win.__adminFetchPatched = true;
  win.__adminOriginalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const originalFetch = win.__adminOriginalFetch ?? window.fetch.bind(window);
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    if (url.startsWith("/api/") && isAdminSessionExpired()) {
      clearAdminSession();
      window.location.reload();
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Admin session expired." }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );
    }
    if (url.startsWith("/api/") && win.__adminAccessToken) {
      const headers = new Headers(init.headers);
      headers.set("authorization", `Bearer ${win.__adminAccessToken}`);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}
