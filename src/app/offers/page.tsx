import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function OffersPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.offers} />;
}
