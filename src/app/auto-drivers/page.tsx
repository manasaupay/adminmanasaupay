import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";

export default function AutoDriversPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.auto_drivers} />;
}
