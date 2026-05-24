import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function SponsoredShopsPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.sponsored_shops} />;
}
