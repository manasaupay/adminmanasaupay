import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

const allowedRoles = new Set([
  "business",
  "service_provider",
  "auto_driver",
  "admin",
]);

const assignmentConfig = {
  business: {
    table: "businesses",
    field: "owner_id",
    label: "business/shop",
    appType: "business",
  },
  service_provider: {
    table: "services",
    field: "provider_id",
    label: "service profile",
    appType: "service",
  },
  auto_driver: {
    table: "auto_drivers",
    field: "user_id",
    label: "auto driver profile",
    appType: "auto_driver",
  },
} as const;

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
  const assignedTargetId = String(body.assignedTargetId ?? "").trim();

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email and password with at least 6 characters are required." },
      { status: 400 },
    );
  }
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: "Invalid partner role." }, { status: 400 });
  }
  const assignment =
    role === "admin" ? null : assignmentConfig[role as keyof typeof assignmentConfig];
  if (assignment && !assignedTargetId) {
    return NextResponse.json(
      { error: `Select a ${assignment.label} before creating this partner.` },
      { status: 400 },
    );
  }

  const supabase = getAdminClient()!;
  if (assignment) {
    const { data: target, error: targetError } = await supabase
      .from(assignment.table)
      .select(`id,${assignment.field}`)
      .eq("id", assignedTargetId)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json(
        { error: `Selected ${assignment.label} was not found.` },
        { status: 404 },
      );
    }
    const targetRecord = target as Record<string, unknown>;
    if (targetRecord[assignment.field]) {
      return NextResponse.json(
        { error: `Selected ${assignment.label} is already assigned.` },
        { status: 409 },
      );
    }
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
      app_metadata: {
        role,
        assigned_target_type: assignment?.appType,
        assigned_target_id: assignment ? assignedTargetId : undefined,
      },
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
    meta: {
      assigned_target_type: assignment?.appType,
      assigned_target_id: assignment ? assignedTargetId : undefined,
    },
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (assignment) {
    const { error: assignError } = await supabase
      .from(assignment.table)
      .update({ [assignment.field]: authData.user.id })
      .eq("id", assignedTargetId);

    if (assignError) {
      await supabase.from("users").delete().eq("id", authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    id: authData.user.id,
    email,
    role,
    assignedTargetId: assignment ? assignedTargetId : null,
  });
}
