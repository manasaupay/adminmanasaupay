import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
  }

  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const { action } = await req.json();
  if (!action || !["mark_read", "delete"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Use 'mark_read' or 'delete'" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient()!;

  try {
    if (action === "mark_read") {
      const { data, error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else if (action === "delete") {
      const { data, error } = await supabase
        .from("notifications")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Notification deleted" });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
