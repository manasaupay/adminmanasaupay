import { ADMIN_TABLES } from "@/lib/admin-tables";
import { SupabaseCrudTable } from "@/components/supabase-crud-table";
import { PartnerUserCard } from "@/components/partner-user-card";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <PartnerUserCard />
        <section className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Partner Call Permission Status
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Users table mein partner accounts ke liye call-related Android
                permissions sync ho kar dikhengi.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <ul className="list-disc space-y-2 pl-4">
                <li>
                  <strong className="text-slate-800">Call Status</strong>:
                  Call Ready / Needs Permission Fix / Not Synced Yet
                </li>
                <li>
                  <strong className="text-slate-800">Call Notif</strong>:
                  notification permission on/off
                </li>
                <li>
                  <strong className="text-slate-800">Full Screen</strong>:
                  incoming call screen full-screen permission
                </li>
                <li>
                  <strong className="text-slate-800">Battery Free</strong>:
                  battery optimization ignore status
                </li>
                <li>
                  <strong className="text-slate-800">Perm Sync</strong>:
                  last app sync time from partner device
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      <SupabaseCrudTable config={ADMIN_TABLES.users} />
    </div>
  );
}
