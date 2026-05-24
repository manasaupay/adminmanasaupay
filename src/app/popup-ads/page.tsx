import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function PopupAdsPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.popup_ads} />;
}
