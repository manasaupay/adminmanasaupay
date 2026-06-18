import { NextRequest, NextResponse } from "next/server";
import { isAdminTable } from "@/lib/admin-tables";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type Params = { params: Promise<{ table: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authError = await requireAdminRequest(_req);
  if (authError) return authError;
  const { table } = await params;
  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const supabase = getAdminClient()!;
  const orderColumn = table === "call_sessions" ? "started_at" : "created_at";
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderColumn, { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
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
  
  // Query state before update to check transition
  const { data: beforeData } = await supabase.from(table).select("*").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Transition check: was not approved/active before, but is approved/active now
  const isApprovedNow = data.is_approved === true || data.active === true;
  const wasApprovedBefore = beforeData?.is_approved === true || beforeData?.active === true;
  if (isApprovedNow && !wasApprovedBefore) {
    void triggerAutoNotification(table, data);
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const { table } = await params;
  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const payload = await req.json();
  const supabase = getAdminClient()!;
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Check if item is created active/approved on insertion
  const isApproved = data.is_approved !== false && data.active !== false;
  if (isApproved) {
    void triggerAutoNotification(table, data);
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;
  const { table } = await params;
  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  const configError = getAdminConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const supabase = getAdminClient()!;
  const { data, error } = await supabase.from(table).delete().eq("id", id).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

type AdminRow = Record<string, unknown>;

function text(row: AdminRow, key: string, fallback = "") {
  const value = row[key];
  return value === null || value === undefined || value === ""
    ? fallback
    : String(value);
}

export async function triggerAutoNotification(table: string, data: AdminRow) {
  const ignored = new Set([
    "ads",
    "sponsored_shops",
    "users",
    "chat_messages",
    "notifications",
    "settings",
  ]);
  if (ignored.has(table)) return;

  let title = "";
  let body = "";
  let deepLink = "";
  let image = "";

  switch (table) {
    case "jobs":
      title = "New Job Listing Available! 💼";
      body = `${text(data, "title", "Job Opportunity")} - Apply now!`;
      deepLink = `/jobs/${text(data, "id")}`;
      break;
    case "services":
      title = "New Service Provider in Town! 🛠️";
      body = `${text(data, "name", "Local Service")} offers services in ${text(data, "area", "your area")}`;
      deepLink = `/services/${text(data, "id")}`;
      break;
    case "businesses":
      title = "New Business Opened! 🏪";
      body = `${text(data, "name", "Local Shop")} is now live on Manasa Upay!`;
      deepLink = `/shops/${text(data, "id")}`;
      image = text(data, "cover_image", text(data, "logo_url"));
      break;
    case "news":
      title = "Breaking News! 📰";
      body = text(data, "title", "Read the latest update");
      deepLink = `/news/${text(data, "id")}`;
      image = text(data, "image_url");
      break;
    case "events":
      title = "Upcoming Local Event! 📅";
      body = `${text(data, "title", "Town Event")} organized by ${text(data, "organizer", "Community")}`;
      deepLink = `/events/${text(data, "id")}`;
      image = text(data, "banner_url");
      break;
    case "offers":
      title = "New Deal Alert! 🏷️";
      body = `${text(data, "title", "Special Offer")} - Check out the discount!`;
      deepLink = text(data, "business_id") ? `/shops/${text(data, "business_id")}` : "/";
      image = text(data, "banner_url");
      break;
    case "properties":
      title = "New Property Listed! 🏠";
      body = `${text(data, "title", "Real Estate Listing")} in ${text(data, "location", "Manasa")}`;
      deepLink = `/properties/${text(data, "id")}`;
      image = text(data, "image_url");
      break;
    case "resale":
      title = "New Resale Item Available! 🛒";
      body = `${text(data, "title", "Used Item")} - Get it before it's gone!`;
      deepLink = `/resale/${text(data, "id")}`;
      image = text(data, "image_url");
      break;
    case "updates":
      title = "City Update! 📢";
      body = text(data, "title", "New notice from administration");
      deepLink = `/updates/${text(data, "id")}`;
      image = text(data, "image");
      break;
    case "products":
      title = "New Product Added! 🛍️";
      body = `${text(data, "name", "Product")} is now available at ${text(data, "price", "great pricing")}`;
      deepLink = text(data, "business_id") ? `/shops/${text(data, "business_id")}` : "/";
      image = text(data, "image_url");
      break;
    default:
      return;
  }

  try {
    const supabase = getAdminClient()!;
    
    // 1. Save notification to notifications table
    const { data: dbNotification } = await supabase
      .from("notifications")
      .insert({
        title,
        message: body,
        image: image.trim() || null,
        audience: "all",
        deep_link: deepLink,
        target_meta: {},
      })
      .select()
      .single();

    // 2. Fetch FCM device tokens, including anonymous app installs.
    const [{ data: userTokens }, { data: deviceTokens }] = await Promise.all([
      supabase.from("user_fcm_tokens").select("fcm_token"),
      supabase.from("device_fcm_tokens").select("fcm_token"),
    ]);
    const tokens = [...(userTokens ?? []), ...(deviceTokens ?? [])];

    if (tokens && tokens.length > 0) {
      const { getFirebaseMessaging, getFirebaseConfigError } = await import("@/lib/firebase-admin");
      if (!getFirebaseConfigError()) {
        const messaging = getFirebaseMessaging();
        const uniqueTokens = Array.from(new Set(tokens.map((t) => t.fcm_token).filter(Boolean)));
        
        const fcmMessage = {
          tokens: uniqueTokens,
          notification: {
            title,
            body,
            imageUrl: image.trim() || undefined,
          },
          data: {
            title,
            body,
            deep_link: deepLink,
            notification_id: dbNotification?.id || "",
          },
          android: {
            priority: "high" as const,
            notification: {
              channelId: "manasa_upay_updates",
              sound: "default",
            },
          },
        };

        // Send in multicast chunks of 500
        for (let i = 0; i < uniqueTokens.length; i += 500) {
          const chunk = uniqueTokens.slice(i, i + 500);
          await messaging.sendEachForMulticast({ ...fcmMessage, tokens: chunk });
        }
      }
    }
  } catch (err) {
    console.error("Auto-Notification failed:", err);
  }
}
