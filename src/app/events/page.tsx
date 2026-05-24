import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function EventsPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.events} />;
}
