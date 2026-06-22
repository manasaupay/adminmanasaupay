import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";
import { triggerAutoNotification } from "../admin/[table]/route";

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
  const adminAuthError = await requireAdminRequest(req);
  if (adminAuthError) return adminAuthError;
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const whatsapp = String(body.whatsapp ?? "").trim();
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
  const isCreateNew = assignedTargetId === "create_new";

  if (assignment && !isCreateNew) {
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

  // 1. Create the Auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
      app_metadata: {
        role,
        assigned_target_type: assignment?.appType,
        assigned_target_id: !isCreateNew && assignment ? assignedTargetId : undefined,
      },
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Could not create auth user." },
      { status: 500 },
    );
  }

  let finalTargetId = isCreateNew ? null : (assignment ? assignedTargetId : null);

  try {
    // 2. Create the user public profile FIRST to satisfy the foreign key constraint on child tables
    const { error: profileError } = await supabase.from("users").upsert({
      id: authData.user.id,
      email,
      name,
      phone,
      role,
      is_verified: true,
      meta: {
        assigned_target_type: assignment?.appType,
      },
    });

    if (profileError) throw new Error(`Could not create public user record: ${profileError.message}`);

    // 3. Create the new dynamic profile (now that the user record exists!)
    if (assignment && isCreateNew) {
      if (role === "business") {
        const categories = Array.isArray(body.newTargetCategories) && body.newTargetCategories.length > 0 
          ? body.newTargetCategories 
          : ["General"];
        
        const insertData = categories.map((cat: string) => ({
          name: body.newTargetName || name || "New Business",
          category: cat,
          subcategory: body.newTargetSubcategory || "",
          phone: phone || body.newTargetContact || "",
          whatsapp: whatsapp || phone || "",
          owner_id: authData.user.id,
          is_approved: true,
        }));

        const { data: newTargets, error: createError } = await supabase
          .from("businesses")
          .insert(insertData)
          .select("*");

        if (createError) throw new Error(`Could not create business profile: ${createError.message}`);
        finalTargetId = newTargets[0].id;
        newTargets.forEach(target => triggerAutoNotification("businesses", target));
      } else if (role === "service_provider") {
        const categories = Array.isArray(body.newTargetCategories) && body.newTargetCategories.length > 0 
          ? body.newTargetCategories 
          : ["General"];
          
        const insertData = categories.map((cat: string) => ({
          name: body.newTargetName || name || "New Service",
          category: cat,
          subcategory: body.newTargetSubcategory || "",
          contact: phone || body.newTargetContact || "",
          whatsapp: whatsapp || phone || "",
          area: body.newTargetArea || "",
          provider_id: authData.user.id,
          is_approved: true,
        }));

        const { data: newTargets, error: createError } = await supabase
          .from("services")
          .insert(insertData)
          .select("*");

        if (createError) throw new Error(`Could not create service profile: ${createError.message}`);
        finalTargetId = newTargets[0].id;
        newTargets.forEach((target: any) => triggerAutoNotification("services", target));
      } else if (role === "auto_driver") {
        const { data: newTarget, error: createError } = await supabase
          .from("auto_drivers")
          .insert({
            name: name || "New Driver",
            phone: phone || "",
            whatsapp: whatsapp || phone || "",
            vehicle_number: body.newTargetVehicleNumber || "TBD",
            area: body.newTargetArea || "",
            user_id: authData.user.id,
            is_approved: true,
          })
          .select("id")
          .single();

        if (createError) throw new Error(`Could not create auto driver profile: ${createError.message}`);
        finalTargetId = newTarget.id;
      }

      // Update the public user profile's meta to link the created profile ID
      if (finalTargetId) {
        const { error: updateProfileError } = await supabase
          .from("users")
          .update({
            meta: {
              assigned_target_type: assignment.appType,
              assigned_target_id: finalTargetId,
            },
          })
          .eq("id", authData.user.id);
        
        if (updateProfileError) {
          throw new Error(`Could not link final target ID to public user profile: ${updateProfileError.message}`);
        }
      }
    }

    // 4. Update the existing profile if assigning to an already existing profile
    if (assignment && !isCreateNew) {
      const { error: assignError } = await supabase
        .from(assignment.table)
        .update({ [assignment.field]: authData.user.id })
        .eq("id", assignedTargetId);

      if (assignError) throw new Error(`Could not update target profile: ${assignError.message}`);

      // Update public user profile's meta with the existing linked profile ID
      const { error: updateProfileError } = await supabase
        .from("users")
        .update({
          meta: {
            assigned_target_type: assignment.appType,
            assigned_target_id: assignedTargetId,
          },
        })
        .eq("id", authData.user.id);
      
      if (updateProfileError) {
        throw new Error(`Could not link target ID to public user profile: ${updateProfileError.message}`);
      }
    }

    // 5. Update Auth app_metadata if we dynamically created the profile
    if (assignment && isCreateNew && finalTargetId) {
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authData.user.id, {
        app_metadata: {
          role,
          assigned_target_type: assignment.appType,
          assigned_target_id: finalTargetId,
        },
      });
      if (updateAuthError) {
        console.error("Warning: Could not update auth app_metadata:", updateAuthError.message);
      }
    }

  } catch (e: unknown) {
    // Rollback operations in case of failures
    if (assignment && isCreateNew && finalTargetId) {
      await supabase.from(assignment.table).delete().eq("id", finalTargetId);
    }
    await supabase.from("users").delete().eq("id", authData.user.id);
    await supabase.auth.admin.deleteUser(authData.user.id);

    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create partner." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: authData.user.id,
    email,
    role,
    assignedTargetId: finalTargetId,
  });
}
