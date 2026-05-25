import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { PartnerUserCard } from "@/components/partner-user-card";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PartnerUserCard />
      <SupabaseCrudTable config={ADMIN_TABLES.users} />
    </div>
  );
}
