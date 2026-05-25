import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";

export default function CallsPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.call_sessions} />;
}
