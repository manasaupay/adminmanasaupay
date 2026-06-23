type Row = Record<string, unknown>;

export type PartnerCallReadiness =
  | "call_ready"
  | "needs_fix"
  | "not_synced"
  | "not_partner";

const partnerRoles = new Set(["business", "service_provider", "auto_driver"]);

export function isPartnerRole(role: unknown) {
  return partnerRoles.has(String(role ?? ""));
}

function permissionMeta(row: Row) {
  const meta = row.meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const permissions = (meta as Record<string, unknown>).partner_call_permissions;
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return null;
  }
  return permissions as Record<string, unknown>;
}

export function getPartnerCallReadiness(row: Row): PartnerCallReadiness {
  const role = row.role;
  if (!isPartnerRole(role)) return "not_partner";

  const perms = permissionMeta(row);
  if (!perms || !perms.last_synced_at) return "not_synced";

  const notification = perms.notification_permission === true;
  const fullScreen = perms.full_screen_intent_permission === true;
  const battery = perms.battery_optimization_ignored === true;

  if (notification && fullScreen && battery) return "call_ready";
  return "needs_fix";
}

export function callReadinessLabel(status: PartnerCallReadiness) {
  switch (status) {
    case "call_ready":
      return "Call Ready";
    case "needs_fix":
      return "Needs Permission Fix";
    case "not_synced":
      return "Not Synced Yet";
    default:
      return "N/A";
  }
}

export function callReadinessBadgeClass(status: PartnerCallReadiness) {
  switch (status) {
    case "call_ready":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "needs_fix":
      return "bg-red-50 text-red-700 border-red-200";
    case "not_synced":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

export function missingPermissionHints(row: Row) {
  const perms = permissionMeta(row);
  if (!perms) return "App login ke baad sync nahi hua";

  const missing: string[] = [];
  if (perms.notification_permission !== true) missing.push("Notifications");
  if (perms.full_screen_intent_permission !== true) missing.push("Full screen");
  if (perms.battery_optimization_ignored !== true) missing.push("Battery");

  return missing.length > 0 ? `Missing: ${missing.join(", ")}` : "All set";
}
