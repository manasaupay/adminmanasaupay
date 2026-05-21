import { SendNotificationButton } from "./send-notification-button";

type SectionPageProps = {
  title: string;
  description: string;
  sectionKey: string;
};

export function SectionPage({ title, description, sectionKey }: SectionPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-600">{description}</p>
        </div>
        <SendNotificationButton section={sectionKey} />
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        Connect Supabase to load and manage records. Schema is in{" "}
        <code className="text-sm">supabase/migrations/001_initial_schema.sql</code>
      </div>
    </div>
  );
}
