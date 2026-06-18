import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, isAdminCredential } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");

  if (!isAdminCredential(username, password)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  }

  return NextResponse.json({ token: createAdminSessionToken() });
}
