"use client";

import { useEffect, useState } from "react";

type AuthState = "checking" | "signed_out" | "signed_in";

const ADMIN_SESSION_MS = 60 * 60 * 1000;
const ADMIN_LOGIN_AT_KEY = "manasa_admin_login_at";
const ADMIN_TOKEN_KEY = "manasa_admin_session_token";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
      if (token && !isAdminSessionExpired()) {
        installAuthFetch(token);
        setState("signed_in");
        return;
      }
      clearAdminSession();
      setState("signed_out");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (state === "signed_in" && isAdminSessionExpired()) {
        clearAdminSession();
        setState("signed_out");
        setMessage("Admin session expired. Please login again.");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setMessage("Please enter username and password.");
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error ?? "Login failed.");
      }
      window.localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      window.localStorage.setItem(ADMIN_LOGIN_AT_KEY, String(Date.now()));
      installAuthFetch(data.token);
      setPassword("");
      setState("signed_in");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
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
          Enter your admin credentials to continue.
        </p>

        <form onSubmit={login} className="mt-6 space-y-3">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Username"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-teal-500"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={busy || state === "checking"}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {state === "checking" ? "Checking..." : busy ? "Please wait..." : "Login"}
          </button>
        </form>

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

function isAdminSessionExpired(now = Date.now()) {
  const loginAt = getStoredTime(ADMIN_LOGIN_AT_KEY);
  return Boolean(!loginAt || now - loginAt >= ADMIN_SESSION_MS);
}

function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_LOGIN_AT_KEY);
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  installAuthFetch("");
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
    if (url.startsWith("/api/") && url !== "/api/admin/login" && isAdminSessionExpired()) {
      clearAdminSession();
      window.location.reload();
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Admin session expired." }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );
    }
    if (url.startsWith("/api/") && url !== "/api/admin/login" && win.__adminAccessToken) {
      const headers = new Headers(init.headers);
      headers.set("authorization", `Bearer ${win.__adminAccessToken}`);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}
