"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const roles = [
  { value: "business", label: "Business Partner" },
  { value: "service_provider", label: "Service Provider" },
  { value: "auto_driver", label: "Auto Driver" },
  { value: "admin", label: "Administrator" },
];

type Option = { value: string; label: string };
type OptionMap = Record<string, Option[]>;

export function PartnerUserCard() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "business",
    assignedTargetId: "",
    newTargetName: "",
    newTargetCategory: "",
    newTargetSubcategory: "",
    newTargetArea: "",
    newTargetVehicleNumber: "",
  });
  const [options, setOptions] = useState<OptionMap>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/options")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setOptions(data);
      })
      .catch(() => setOptions({}));
  }, []);

  const assignment = useMemo(() => {
    if (form.role === "business") {
      return {
        label: "Shop / Business",
        options: options.unassignedBusinesses ?? [],
        categories: (options as any).businessCategories ?? [],
      };
    }
    if (form.role === "service_provider") {
      return {
        label: "Service Profile",
        options: options.unassignedServices ?? [],
        categories: (options as any).serviceCategories ?? [],
      };
    }
    if (form.role === "auto_driver") {
      return {
        label: "Auto Driver Profile",
        options: options.unassignedAutoDrivers ?? [],
        categories: [],
      };
    }
    return null;
  }, [form.role, options]);

  // Compute subcategories cascading selection in real-time
  const subcategories = useMemo(() => {
    if (!form.newTargetCategory) return [];
    return ((options as any).allCategories ?? [])
      .filter((cat: any) => cat.parent_key === form.newTargetCategory)
      .map((cat: any) => ({
        value: cat.key,
        label: cat.label ?? cat.key,
      }));
  }, [form.newTargetCategory, options]);

  async function createPartner() {
    if (assignment && !form.assignedTargetId) {
      setError(`Select or Create a ${assignment.label} before creating login.`);
      return;
    }
    if (assignment && form.assignedTargetId === "create_new") {
      if (form.role !== "auto_driver" && !form.newTargetCategory) {
        setError(`Please select a Category for the new ${assignment.label}.`);
        return;
      }
      if (form.role === "auto_driver" && !form.newTargetVehicleNumber.trim()) {
        setError("Please enter a Vehicle Number for the new driver.");
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      // Resolve category and subcategory keys to their corresponding labels
      const parentCat = ((options as any).allCategories ?? []).find(
        (c: any) => c.key === form.newTargetCategory
      );
      const subCat = ((options as any).allCategories ?? []).find(
        (c: any) => c.key === form.newTargetSubcategory
      );

      const payload = {
        ...form,
        newTargetCategory: parentCat ? parentCat.label : form.newTargetCategory,
        newTargetSubcategory: subCat ? subCat.label : form.newTargetSubcategory,
      };

      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create partner");
      setMessage(`Partner account created successfully: ${data.email}`);
      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        role: "business",
        assignedTargetId: "",
        newTargetName: "",
        newTargetCategory: "",
        newTargetSubcategory: "",
        newTargetArea: "",
        newTargetVehicleNumber: "",
      });
      fetch("/api/admin/options")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setOptions(data);
        })
        .catch(() => setOptions({}));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create partner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-card rounded-3xl border border-slate-800 bg-slate-900/30 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0">
            <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-white">Create Partner Login & Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set up credentials for the Manasa Upay app and link them to a listing instantly.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={createPartner}
          className="rounded-xl bg-teal-500 px-5 py-3 text-xs font-black tracking-wide text-slate-950 hover:bg-teal-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 shadow-md shadow-teal-500/10 cursor-pointer"
        >
          {saving ? "Creating Partner..." : "Create & Link Account"}
        </button>
      </div>

      {/* Grid Inputs */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Partner Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. John Doe"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Phone Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 9893xxxxxx"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Email Address</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="partner@gmail.com"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Password</label>
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min 6 chars"
            type="password"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Partner Role</label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
                assignedTargetId: "",
              })
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white focus:border-teal-500/40 outline-none transition-all"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value} className="bg-slate-950 text-white">
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile Assignment Section */}
      {assignment && (
        <div className="mt-5 space-y-2 border-t border-slate-900/60 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">Profile Assignment Linkage</p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                Map this user credentials to an existing profile, or choose to build a new one dynamically.
              </p>
            </div>
            <select
              value={form.assignedTargetId}
              onChange={(e) =>
                setForm({
                  ...form,
                  assignedTargetId: e.target.value,
                  newTargetName: "",
                  newTargetCategory: "",
                  newTargetSubcategory: "",
                  newTargetArea: "",
                  newTargetVehicleNumber: "",
                })
              }
              className="w-full sm:w-80 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold text-teal-400 focus:border-teal-500/40 outline-none transition-all cursor-pointer"
              required
            >
              <option value="" className="bg-slate-950 text-slate-400">-- Link {assignment.label} --</option>
              <option value="create_new" className="bg-slate-950 text-teal-400 font-bold">
                + Create New {assignment.label} (Automated Setup)
              </option>
              {assignment.options.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-950 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Builder fields for "+ Create New Profile" */}
          {form.assignedTargetId === "create_new" && (
            <div className="mt-3 p-5 rounded-2xl border border-teal-500/10 bg-teal-500/5 grid gap-4 md:grid-cols-3">
              <div className="col-span-3 pb-1 border-b border-teal-500/10">
                <p className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 glow-active shadow-[0_0_8px_#2dd4bf]" />
                  Dynamic Profile Wizard
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Specify details below. The console will automatically create, approve, and link the profile to this login.
                </p>
              </div>

              {form.role !== "auto_driver" && (
                <>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Profile Name</label>
                    <input
                      value={form.newTargetName}
                      onChange={(e) => setForm({ ...form, newTargetName: e.target.value })}
                      placeholder="e.g. Acme Service Hub (defaults to partner)"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Service Category *</label>
                    {assignment.categories.length === 0 ? (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-[10px] text-red-400 leading-normal font-bold">
                        ⚠️ No categories found for <strong className="text-white">"{form.role === 'service_provider' ? 'services' : 'businesses'}"</strong>.
                        <br />
                        <Link href="/add-new" className="text-teal-400 font-bold underline hover:text-teal-300 inline-block mt-1">
                          Create Category first &rarr;
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={form.newTargetCategory}
                        onChange={(e) => setForm({ ...form, newTargetCategory: e.target.value, newTargetSubcategory: "" })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white focus:border-teal-500/40 outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Choose Category --</option>
                        {assignment.categories.map((cat: any) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Cascading Subcategory Dropdown list to avoid human typing mistakes! */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Subcategory</label>
                    <select
                      value={form.newTargetSubcategory}
                      onChange={(e) => setForm({ ...form, newTargetSubcategory: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white focus:border-teal-500/40 outline-none cursor-pointer"
                      disabled={!form.newTargetCategory}
                    >
                      <option value="">-- Select Subcategory (optional) --</option>
                      {subcategories.map((sub: any) => (
                        <option key={sub.value} value={sub.value} className="bg-slate-950 text-white">
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {form.role === "service_provider" && (
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Coverage Area</label>
                  <input
                    value={form.newTargetArea}
                    onChange={(e) => setForm({ ...form, newTargetArea: e.target.value })}
                    placeholder="e.g. Sector 5, Downtown"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 outline-none"
                  />
                </div>
              )}

              {form.role === "auto_driver" && (
                <>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Vehicle Number *</label>
                    <input
                      value={form.newTargetVehicleNumber}
                      onChange={(e) => setForm({ ...form, newTargetVehicleNumber: e.target.value })}
                      placeholder="e.g. MH12AB1234"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Operation Area</label>
                    <input
                      value={form.newTargetArea}
                      onChange={(e) => setForm({ ...form, newTargetArea: e.target.value })}
                      placeholder="e.g. Airport, Sector 5"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:border-teal-500/40 outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Unassigned Warning Indicator */}
      {assignment && assignment.options.length === 0 && form.assignedTargetId !== "create_new" && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[11px] text-amber-400 font-bold leading-normal">
            No unassigned profiles are currently available. We highly recommend selecting <strong className="text-white">"+ Create New {assignment.label}"</strong> in the link selector above to automatically create and bind one.
          </p>
        </div>
      )}

      {/* Response Banners */}
      {message && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2.5">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold text-red-400 flex items-center gap-2.5">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
    </section>
  );
}
