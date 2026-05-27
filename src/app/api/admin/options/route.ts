import { NextResponse } from "next/server";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type Option = { value: string; label: string };

function uniqueOptions(options: Option[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

export async function GET() {
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const supabase = getAdminClient()!;
  const [categories, businesses, services, autoDrivers, users, chatThreads] =
    await Promise.all([
    supabase
      .from("categories")
      .select("key,label,parent_key,scope")
      .order("sort_order")
      .order("label"),
    supabase.from("businesses").select("id,name,category,owner_id").order("name"),
    supabase.from("services").select("id,name,category,area,provider_id").order("name"),
    supabase
      .from("auto_drivers")
      .select("id,name,phone,vehicle_number,user_id")
      .order("name"),
    supabase.from("users").select("id,name,email,phone,role").order("created_at", {
      ascending: false,
    }),
    supabase
      .from("chat_threads")
      .select("id,target_name,last_message")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const firstError =
    categories.error ??
    businesses.error ??
    services.error ??
    autoDrivers.error ??
    users.error ??
    chatThreads.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const categoryRows = categories.data ?? [];
  const businessRows = businesses.data ?? [];
  const serviceRows = services.data ?? [];
  const autoDriverRows = autoDrivers.data ?? [];
  const userRows = users.data ?? [];
  const threadRows = chatThreads.data ?? [];

  return NextResponse.json({
    categoryLabels: uniqueOptions(
      categoryRows.map((row) => ({
        value: row.label ?? row.key,
        label: `${row.label ?? row.key}${row.scope ? ` · ${row.scope}` : ""}`,
      })),
    ),
    categoryKeys: uniqueOptions(
      categoryRows.map((row) => ({
        value: row.key,
        label: `${row.label ?? row.key}${row.parent_key ? ` / ${row.parent_key}` : ""}`,
      })),
    ),
    serviceCategories: uniqueOptions(
      categoryRows
        .filter((row) => row.scope === "services" || row.scope === "global")
        .map((row) => ({
          value: row.key,
          label: row.label ?? row.key,
        })),
    ),
    businessCategories: uniqueOptions(
      categoryRows
        .filter((row) => row.scope === "businesses" || row.scope === "global")
        .map((row) => ({
          value: row.key,
          label: row.label ?? row.key,
        })),
    ),
    businesses: businessRows.map((row) => ({
      value: row.id,
      label: `${row.name ?? "Business"}${row.category ? ` · ${row.category}` : ""}`,
    })),
    unassignedBusinesses: businessRows
      .filter((row) => !row.owner_id)
      .map((row) => ({
        value: row.id,
        label: `${row.name ?? "Business"}${row.category ? ` · ${row.category}` : ""}`,
      })),
    services: serviceRows.map((row) => ({
      value: row.id,
      label: `${row.name ?? "Service"}${row.area ? ` · ${row.area}` : ""}`,
    })),
    unassignedServices: serviceRows
      .filter((row) => !row.provider_id)
      .map((row) => ({
        value: row.id,
        label: `${row.name ?? "Service"}${row.area ? ` · ${row.area}` : ""}`,
      })),
    autoDrivers: autoDriverRows.map((row) => ({
      value: row.id,
      label: `${row.name ?? "Driver"}${row.vehicle_number ? ` · ${row.vehicle_number}` : ""}`,
    })),
    unassignedAutoDrivers: autoDriverRows
      .filter((row) => !row.user_id)
      .map((row) => ({
        value: row.id,
        label: `${row.name ?? "Driver"}${row.vehicle_number ? ` · ${row.vehicle_number}` : ""}`,
      })),
    users: userRows.map((row) => ({
      value: row.id,
      label:
        row.name ??
        row.email ??
        row.phone ??
        `${row.role ?? "user"} · ${String(row.id).slice(0, 8)}`,
    })),
    chatThreads: threadRows.map((row) => ({
      value: row.id,
      label: `${row.target_name ?? "Thread"}${row.last_message ? ` · ${row.last_message}` : ""}`,
    })),
  });
}
