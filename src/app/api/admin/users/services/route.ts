import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { userId, categories } = await req.json();

  if (!userId || !Array.isArray(categories)) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const supabase = getAdminClient()!;

  // 1. Fetch existing services for this user
  const { data: existingServices, error: fetchError } = await supabase
    .from("services")
    .select("id, category")
    .eq("provider_id", userId);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingCategories = existingServices?.map(s => s.category) || [];

  // 2. Identify categories to add and remove
  const toAdd = categories.filter(c => !existingCategories.includes(c));
  const toRemove = existingCategories.filter(c => !categories.includes(c));

  // 3. Remove deselected categories
  if (toRemove.length > 0) {
    const idsToRemove = existingServices!
      .filter(s => toRemove.includes(s.category))
      .map(s => s.id);
    
    if (idsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .in("id", idsToRemove);
      
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }
  }

  // 4. Add newly selected categories
  if (toAdd.length > 0) {
    // We need some user details to populate the new service
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("name, phone")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: "Could not fetch user details" }, { status: 500 });
    }

    const insertData = toAdd.map(cat => ({
      provider_id: userId,
      category: cat,
      name: user.name || "Service Profile",
      contact: user.phone || "",
      whatsapp: user.phone || "",
      is_approved: true,
    }));

    const { error: insertError } = await supabase
      .from("services")
      .insert(insertData);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
