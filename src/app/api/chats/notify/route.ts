import { NextRequest, NextResponse } from "next/server";
import { MulticastMessage } from "firebase-admin/messaging";

import {
  getFirebaseConfigError,
  getFirebaseMessaging,
} from "@/lib/firebase-admin";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type ChatNotifyPayload = {
  thread_id?: string;
  message?: string;
  sender_type?: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  target_phone?: string;
};

const targetConfig = {
  business: { table: "businesses", ownerField: "owner_id" },
  service: { table: "services", ownerField: "provider_id" },
  auto_driver: { table: "auto_drivers", ownerField: "user_id" },
} as const;

export async function POST(req: NextRequest) {
  const supabaseError = getAdminConfigError();
  if (supabaseError) {
    return NextResponse.json({ error: supabaseError }, { status: 503 });
  }

  const firebaseError = getFirebaseConfigError();
  if (firebaseError) {
    return NextResponse.json({ error: firebaseError }, { status: 503 });
  }

  const payload = (await req.json()) as ChatNotifyPayload;
  const threadId = payload.thread_id?.trim();
  const text = payload.message?.trim();
  const senderType = payload.sender_type?.trim() || "user";
  const targetType = payload.target_type?.trim();
  const targetId = payload.target_id?.trim();
  const targetName = payload.target_name?.trim() || "Customer";
  const targetPhone = payload.target_phone?.trim() || "";

  if (!threadId || !text || !targetType || !targetId) {
    return NextResponse.json(
      { error: "thread_id, message, target_type, and target_id are required." },
      { status: 400 },
    );
  }

  // Find the partner owner of this target
  const config = targetConfig[targetType as keyof typeof targetConfig];
  if (!config) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "Target type does not have a partner owner for chat push.",
    });
  }

  const supabase = getAdminClient()!;
  const { data: target, error: targetError } = await supabase
    .from(config.table)
    .select(config.ownerField)
    .eq("id", targetId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  const ownerId = target?.[config.ownerField as keyof typeof target] as
    | string
    | null
    | undefined;
  if (!ownerId) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "No partner user is assigned to this target.",
    });
  }

  // Get active FCM tokens for the partner user
  const { data: tokens, error: tokenError } = await supabase
    .from("user_fcm_tokens")
    .select("fcm_token")
    .eq("user_id", ownerId);

  if (tokenError) {
    return NextResponse.json({ error: tokenError.message }, { status: 500 });
  }

  const fcmTokens = Array.from(
    new Set((tokens ?? []).map((row) => row.fcm_token).filter(Boolean)),
  );

  if (fcmTokens.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "Partner has no saved device tokens.",
    });
  }

  // Format deep link with queries so partner opens the chat screen correctly
  const deepLink = `/partner/chats/${threadId}?targetType=${targetType}&targetId=${targetId}&targetName=${encodeURIComponent(
    targetName,
  )}&targetPhone=${encodeURIComponent(targetPhone)}`;

  const message: MulticastMessage = {
    tokens: fcmTokens,
    data: {
      type: "new_chat",
      title: "New chat message",
      body: text.length > 60 ? `${text.slice(0, 57)}...` : text,
      thread_id: threadId,
      message: text,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      target_phone: targetPhone,
      deep_link: deepLink,
    },
    android: {
      priority: "high",
      ttl: 60 * 60 * 24, // 1 day TTL
    },
  };

  const response = await getFirebaseMessaging().sendEachForMulticast(message);
  return NextResponse.json({
    sent: response.successCount,
    failed: response.failureCount,
  });
}
