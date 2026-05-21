import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";

export default function ServicesPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.services} />;
}
