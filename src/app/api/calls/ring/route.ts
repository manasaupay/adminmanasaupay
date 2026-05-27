import { NextRequest, NextResponse } from "next/server";
import { MulticastMessage } from "firebase-admin/messaging";

import {
  getFirebaseConfigError,
  getFirebaseMessaging,
} from "@/lib/firebase-admin";
import { getAdminClient, getAdminConfigError } from "@/lib/supabase/admin";

type CallRingPayload = {
  call_id?: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
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

  const payload = (await req.json()) as CallRingPayload;
  const callId = payload.call_id?.trim();
  const targetType = payload.target_type?.trim();
  const targetId = payload.target_id?.trim();
  const targetName = payload.target_name?.trim() || "Manasa Upay";

  if (!callId || !targetType || !targetId) {
    return NextResponse.json(
      { error: "call_id, target_type, and target_id are required." },
      { status: 400 },
    );
  }

  const config = targetConfig[targetType as keyof typeof targetConfig];
  if (!config) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "This target type does not have a partner owner for call push.",
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

  const message: MulticastMessage = {
    tokens: fcmTokens,
    data: {
      type: "incoming_call",
      title: "Incoming Manasa Upay call",
      body: `${targetName} is calling`,
      call_id: callId,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      deep_link: `/partner/calls/${callId}`,
    },
    android: {
      priority: "high",
      ttl: 30_000,
      notification: {
        channelId: "manasa_upay_calls",
        sound: "default",
        priority: "max",
        defaultVibrateTimings: true,
        defaultSound: true,
      },
    },
  };

  const response = await getFirebaseMessaging().sendEachForMulticast(message);
  return NextResponse.json({
    sent: response.successCount,
    failed: response.failureCount,
  });
}
