import { NextRequest, NextResponse } from "next/server";
import { isAdminTable } from "@/lib/admin-tables";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type Params = { params: Promise<{ table: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { table } = await params;
  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const supabase = getAdminClient()!;
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { table } = await params;
  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const { id, ...updates } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const supabase = getAdminClient()!;
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
