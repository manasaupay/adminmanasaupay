import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";

export default function UsersPage() {
  return <SupabaseCrudTable config={ADMIN_TABLES.users} />;
}
