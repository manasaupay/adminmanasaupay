import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function AnalyticsPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.analytics} />;
}
