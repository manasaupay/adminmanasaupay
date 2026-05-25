import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";

export default function ChatsPage() {
  return (
    <div className="space-y-6">
      <SupabaseCrudTable config={ADMIN_TABLES.chat_threads} />
      <SupabaseCrudTable config={ADMIN_TABLES.chat_messages} />
    </div>
  );
}
