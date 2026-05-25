"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/constants";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xl font-semibold text-slate-950">Manasa Upay</p>
        <p className="mt-1 text-sm text-slate-500">Operations console</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <Link
          href="/"
          className={`block rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-teal-50 text-teal-900 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Dashboard
        </Link>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-50 text-teal-900 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
        <p className="font-semibold text-slate-700">Partner ops</p>
        <p className="mt-1">Create credentials from Users, approve listings, then manage chats and calls.</p>
      </div>
    </aside>
  );
}
