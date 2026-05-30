"use client";

import React, { useState } from "react";

type RolePermission = {
  module: string;
  superAdmin: boolean;
  contentManager: boolean;
  adManager: boolean;
  businessManager: boolean;
  moderator: boolean;
  analyst: boolean;
};

export default function RolesPermissionsPage() {
  const [permissions, setPermissions] = useState<RolePermission[]>([
    { module: "Users Management", superAdmin: true, contentManager: false, adManager: false, businessManager: false, moderator: false, analyst: false },
    { module: "Shops & Directory", superAdmin: true, contentManager: true, adManager: false, businessManager: true, moderator: true, analyst: false },
    { module: "Services Boost", superAdmin: true, contentManager: true, adManager: false, businessManager: true, moderator: true, analyst: false },
    { module: "Advertisement OS", superAdmin: true, contentManager: false, adManager: true, businessManager: false, moderator: false, analyst: false },
    { module: "Sponsorship Boost", superAdmin: true, contentManager: false, adManager: true, businessManager: false, moderator: false, analyst: false },
    { module: "FCM Push Campaigns", superAdmin: true, contentManager: true, adManager: true, businessManager: false, moderator: false, analyst: false },
    { module: "Homepage visual Builder", superAdmin: true, contentManager: true, adManager: false, businessManager: false, moderator: false, analyst: false },
    { module: "Financial Reports", superAdmin: true, contentManager: false, adManager: false, businessManager: false, moderator: false, analyst: true },
    { module: "Audit Log & Rollbacks", superAdmin: true, contentManager: false, adManager: false, businessManager: false, moderator: false, analyst: false },
  ]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const togglePermission = (idx: number, roleKey: keyof Omit<RolePermission, "module">) => {
    setPermissions((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [roleKey]: !p[roleKey] } : p))
    );
  };

  const handleSaveChanges = () => {
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Manage granular Role-Based Access Control (RBAC). Toggle button and module visibilities across console staff keys.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="rounded-xl bg-teal-600 px-5 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? "Saving Matrix..." : "Save RBAC Matrix"}
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-fade-in">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          RBAC Matrix rules updated! Granular button visibilities and module handlers re-authenticated.
        </div>
      )}

      {/* Permissions Matrix Table */}
      <section className="glass-card rounded-3xl border border-slate-150 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-900">Granular Permissions Matrix</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Toggle access permissions visually for target operations staff keys.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
              <tr>
                <th className="px-5 py-4 text-left">Operational Module</th>
                <th className="px-5 py-4">Super Admin</th>
                <th className="px-5 py-4">Content Mgr</th>
                <th className="px-5 py-4">Ad Mgr</th>
                <th className="px-5 py-4">Business Mgr</th>
                <th className="px-5 py-4">Moderator</th>
                <th className="px-5 py-4">Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {permissions.map((row, idx) => (
                <tr key={row.module} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-left font-bold text-slate-900">{row.module}</td>
                  
                  {/* Super Admin - Locked to True */}
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={row.superAdmin}
                      disabled
                      className="h-4.5 w-4.5 rounded border-slate-300 text-teal-600 focus:ring-0 opacity-40"
                    />
                  </td>

                  {/* Editable Role checkboxes */}
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={row.contentManager}
                      onChange={() => togglePermission(idx, "contentManager")}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-teal-650 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={row.adManager}
                      onChange={() => togglePermission(idx, "adManager")}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-teal-650 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={row.businessManager}
                      onChange={() => togglePermission(idx, "businessManager")}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-teal-650 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={row.moderator}
                      onChange={() => togglePermission(idx, "moderator")}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-teal-650 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={row.analyst}
                      onChange={() => togglePermission(idx, "analyst")}
                      className="h-4.5 w-4.5 rounded border-slate-350 text-teal-650 focus:ring-0 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
