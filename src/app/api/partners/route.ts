import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

const allowedRoles = new Set([
  "business",
  "service_provider",
  "auto_driver",
  "admin",
]);

export async function POST(req: NextRequest) {
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const role = String(body.role ?? "business");

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email and password with at least 6 characters are required." },
      { status: 400 },
    );
  }
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: "Invalid partner role." }, { status: 400 });
  }

  const supabase = getAdminClient()!;
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
      app_metadata: { role },
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Could not create auth user." },
      { status: 500 },
    );
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: authData.user.id,
    email,
    name,
    phone,
    role,
    is_verified: true,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: authData.user.id,
    email,
    role,
  });
}
