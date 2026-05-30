"use client";

import React, { useState, useEffect } from "react";

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
  const [error, setError] = useState<string | null>(null);

  // Load RBAC matrix from Supabase settings
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const configSetting = data.find((s: any) => s.key === "roles_permissions_config");
          if (configSetting?.value) {
            try {
              const parsed = JSON.parse(configSetting.value);
              if (Array.isArray(parsed)) setPermissions(parsed);
            } catch {
              // Ignore parse errors, use defaults
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const togglePermission = (idx: number, roleKey: keyof Omit<RolePermission, "module">) => {
    setPermissions((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [roleKey]: !p[roleKey] } : p))
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    const payloadValue = JSON.stringify(permissions);

    try {
      const resSettings = await fetch("/api/admin/settings");
      const settingsList = await resSettings.json();
      const layoutRow = Array.isArray(settingsList)
        ? settingsList.find((s: any) => s.key === "roles_permissions_config")
        : null;

      const endpoint = "/api/admin/settings";
      const method = layoutRow ? "PATCH" : "POST";
      const body = layoutRow
        ? { id: layoutRow.id, value: payloadValue }
        : { key: "roles_permissions_config", setting_type: "json", group_name: "security", value: payloadValue, description: "Active dynamic role access matrices" };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save matrix parameters");
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving permissions configuration");
    } finally {
      setSaving(false);
    }
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
            className="rounded-xl bg-teal-600 px-5 py-3 text-xs font-black text-white hover:bg-teal-700 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
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

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-750 flex items-center gap-2 shadow-sm">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
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
                      className="h-4.5 w-4.5 rounded border-slate-350 text-teal-600 focus:ring-0 opacity-40"
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
