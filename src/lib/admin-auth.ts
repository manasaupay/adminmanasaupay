import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_EMAIL = "manasaupay@gmail.com";
const ADMIN_PASSWORD = "Manasaupaysuccesshogaya";
const ADMIN_SESSION_MS = 60 * 60 * 1000;

type AdminTokenPayload = {
  sub: string;
  exp: number;
};

export function isAdminCredential(username: string, password: string) {
  return (
    safeEqual(username.trim().toLowerCase(), ADMIN_EMAIL) &&
    safeEqual(password, ADMIN_PASSWORD)
  );
}

export function createAdminSessionToken() {
  const payload: AdminTokenPayload = {
    sub: ADMIN_EMAIL,
    exp: Date.now() + ADMIN_SESSION_MS,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export async function requireAdminRequest(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Admin access denied." }, { status: 403 });
  }

  return null;
}

function verifyAdminSessionToken(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(signature, sign(body))) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AdminTokenPayload;
    return payload.sub === ADMIN_EMAIL && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function sign(value: string) {
  return createHmac("sha256", getAdminSecret()).update(value).digest("base64url");
}

function getAdminSecret() {
  return (
    process.env.ADMIN_AUTH_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ADMIN_PASSWORD
  );
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}
