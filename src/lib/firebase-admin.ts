import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccount(): FirebaseServiceAccount | null {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;

  try {
    const value = raw.trim().startsWith("{")
      ? raw.trim()
      : Buffer.from(raw.trim(), "base64").toString("utf8");
    const parsed = JSON.parse(value) as FirebaseServiceAccount;
    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: parsed.private_key?.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

export function getFirebaseConfigError(): string | null {
  const account = parseServiceAccount();
  if (!account?.project_id || !account.client_email || !account.private_key) {
    return "FIREBASE_SERVICE_ACCOUNT_JSON missing or invalid. Add Firebase service account JSON to admin env.";
  }
  return null;
}

export function getFirebaseMessaging() {
  const account = parseServiceAccount();
  if (!account) {
    throw new Error("Firebase service account is not configured.");
  }
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key,
      }),
    });
  }
  return getMessaging();
}
