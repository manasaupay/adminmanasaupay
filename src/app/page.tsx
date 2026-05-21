import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants";

const stats = [
  { label: "Total Users", value: "—" },
  { label: "Businesses", value: "—" },
  { label: "Active Ads", value: "—" },
  { label: "Notification Clicks", value: "—" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-slate-600">
          Overview of Manasa Upay — connect Supabase for live metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-teal-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick links</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_ITEMS.filter((n) => n.href !== "/").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-teal-300 hover:bg-teal-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
