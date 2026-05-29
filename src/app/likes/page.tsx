import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function LikesPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.likes} />;
}
