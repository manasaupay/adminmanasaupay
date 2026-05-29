import { NextRequest, NextResponse } from "next/server";
import { MulticastMessage } from "firebase-admin/messaging";

import {
  getFirebaseConfigError,
  getFirebaseMessaging,
} from "@/lib/firebase-admin";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type Audience =
  | "all"
  | "businesses"
  | "service_providers"
  | "auto_drivers"
  | "selected"
  | "categories"
  | "users";

type SendNotificationPayload = {
  title?: string;
  message?: string;
  image?: string;
  audience?: Audience;
  deep_link?: string;
  target_meta?: {
    user_ids?: string[];
    category_keys?: string[];
  };
};

const roleByAudience: Partial<Record<Audience, string>> = {
  businesses: "business",
  service_providers: "service_provider",
  auto_drivers: "auto_driver",
};

export async function POST(req: NextRequest) {
  const supabaseError = getAdminConfigError();
  if (supabaseError) {
    return NextResponse.json({ error: supabaseError }, { status: 503 });
  }

  const payload = (await req.json()) as SendNotificationPayload;
  const title = payload.title?.trim();
  const message = payload.message?.trim();
  const audience = payload.audience ?? "all";

  if (!title || !message) {
    return NextResponse.json(
      { error: "Title and message are required." },
      { status: 400 },
    );
  }

  const supabase = getAdminClient()!;
  const { data: notification, error: insertError } = await supabase
    .from("notifications")
    .insert({
      title,
      message,
      image: payload.image?.trim() || null,
      audience,
      deep_link: payload.deep_link?.trim() || null,
      target_meta: payload.target_meta ?? {},
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const firebaseError = getFirebaseConfigError();
  if (firebaseError) {
    return NextResponse.json({
      notification,
      sent: 0,
      failed: 0,
      message: "Notification successfully saved in Supabase database. However, active push dispatch (FCM) was skipped: Firebase Service Account JSON is not configured in your admin/.env.local or Vercel Environment Variables.",
    });
  }

  const { data: tokens, error: tokenError } = await buildTokenQuery(
    supabase,
    audience,
    payload.target_meta?.user_ids ?? [],
  );

  if (tokenError) {
    return NextResponse.json({ error: tokenError.message }, { status: 500 });
  }

  const fcmTokens = Array.from(
    new Set((tokens ?? []).map((row) => row.fcm_token).filter(Boolean)),
  );

  if (fcmTokens.length === 0) {
    return NextResponse.json({
      notification,
      sent: 0,
      failed: 0,
      message: "Notification saved, but no device tokens matched.",
    });
  }

  const messaging = getFirebaseMessaging();
  let sent = 0;
  let failed = 0;
  const failedTokens: string[] = [];

  for (const chunk of chunks(fcmTokens, 500)) {
    const fcmMessage: MulticastMessage = {
      tokens: chunk,
      notification: {
        title,
        body: message,
        imageUrl: payload.image?.trim() || undefined,
      },
      data: {
        title,
        body: message,
        deep_link: payload.deep_link?.trim() || "",
        notification_id: notification.id,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "manasa_upay_updates",
          sound: "default",
        },
      },
    };

    const response = await messaging.sendEachForMulticast(fcmMessage);
    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((result, index) => {
      if (!result.success) failedTokens.push(chunk[index]);
    });
  }

  return NextResponse.json({
    notification,
    sent,
    failed,
    failedTokens: failedTokens.slice(0, 20),
  });
}

async function buildTokenQuery(
  supabase: NonNullable<ReturnType<typeof getAdminClient>>,
  audience: Audience,
  selectedUserIds: string[],
) {
  if (audience === "selected" || audience === "users") {
    if (selectedUserIds.length === 0) {
      return { data: [], error: null };
    }
    const [userTokens, deviceTokens] = await Promise.all([
      supabase
        .from("user_fcm_tokens")
        .select("fcm_token")
        .in("user_id", selectedUserIds),
      supabase
        .from("device_fcm_tokens")
        .select("fcm_token")
        .in("user_id", selectedUserIds),
    ]);
    return mergeTokenResponses(userTokens, deviceTokens);
  }

  if (audience === "all" || audience === "categories") {
    const [userTokens, deviceTokens] = await Promise.all([
      supabase.from("user_fcm_tokens").select("fcm_token"),
      supabase.from("device_fcm_tokens").select("fcm_token"),
    ]);
    return mergeTokenResponses(userTokens, deviceTokens);
  }

  const role = roleByAudience[audience];
  if (!role) {
    return supabase.from("user_fcm_tokens").select("fcm_token");
  }

  const [userTokens, deviceTokens] = await Promise.all([
    supabase
      .from("user_fcm_tokens")
      .select("fcm_token, users!inner(role)")
      .eq("users.role", role),
    supabase
      .from("device_fcm_tokens")
      .select("fcm_token, users!inner(role)")
      .eq("users.role", role),
  ]);
  return mergeTokenResponses(userTokens, deviceTokens);
}

function mergeTokenResponses(
  ...responses: {
    data: { fcm_token: string }[] | null;
    error: { message: string } | null;
  }[]
) {
  const error = responses.find((response) => response.error)?.error ?? null;
  if (error) return { data: null, error };
  return {
    data: responses.flatMap((response) => response.data ?? []),
    error: null,
  };
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
