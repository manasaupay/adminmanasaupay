import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function ResalePage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.resale} />;
}
