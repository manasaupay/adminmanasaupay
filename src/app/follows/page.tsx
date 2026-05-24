import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { ADMIN_TABLES } from "@/lib/admin-tables";

export default function FollowsPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.follows} />;
}
