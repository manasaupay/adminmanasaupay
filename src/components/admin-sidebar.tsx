"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-6">
        <p className="text-xl font-semibold text-slate-900">Manasa Upay</p>
        <p className="mt-1 text-sm text-slate-500">Admin control center</p>
      </div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400 px-5 py-3">
        Management
      </div>
      <nav className="flex-1 space-y-1 px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-50 text-teal-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
        <p className="font-semibold text-slate-700">Theme</p>
        <p className="mt-1">Light mode only for a clean admin experience.</p>
      </div>
    </aside>
  );
}
