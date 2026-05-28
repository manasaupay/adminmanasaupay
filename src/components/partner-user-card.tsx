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
  const [step, setStep] = useState(1);
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
    whatsapp: "",
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

  const subcategories = useMemo(() => {
    if (!form.newTargetCategory) return [];
    return ((options as any).allCategories ?? [])
      .filter((cat: any) => cat.parent_key === form.newTargetCategory)
      .map((cat: any) => ({
        value: cat.key,
        label: cat.label ?? cat.key,
      }));
  }, [form.newTargetCategory, options]);

  // Client-side step validation
  const validateStep = (currentStep: number) => {
    setError(null);
    if (currentStep === 1) {
      if (!form.name.trim()) return "Partner Name is required.";
      if (!form.phone.trim()) return "Phone Number is required.";
      if (!form.email.trim() || !form.email.includes("@")) return "A valid Email Address is required.";
      if (form.password.length < 6) return "Password must be at least 6 characters.";
    }
    if (currentStep === 2 && assignment) {
      if (!form.assignedTargetId) return `Please select a linkage option for the ${assignment.label}.`;
    }
    if (currentStep === 3 && assignment && form.assignedTargetId === "create_new") {
      if (form.role !== "auto_driver" && !form.newTargetCategory) {
        return `Please select a Category for the new ${assignment.label}.`;
      }
      if (form.role === "auto_driver" && !form.newTargetVehicleNumber.trim()) {
        return "Please specify a Vehicle Number for the new driver.";
      }
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Jump over Step 3 if linking an existing profile
    if (step === 2 && form.assignedTargetId !== "create_new") {
      setStep(4);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (step === 4 && form.assignedTargetId !== "create_new") {
      setStep(2);
    } else {
      setStep((s) => s - 1);
    }
  };

  async function createPartner() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
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
      
      setMessage(`Partner account successfully generated: ${data.email}`);
      setStep(1);
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
        whatsapp: "",
      });
      
      // Refresh options
      fetch("/api/admin/options")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setOptions(data);
        })
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create partner");
    } finally {
      setSaving(false);
    }
  }

  // Resolve labels for confirmation summary
  const selectedRoleLabel = roles.find((r) => r.value === form.role)?.label ?? form.role;
  const linkOptionLabel = form.assignedTargetId === "create_new" 
    ? "Automated Profile Setup" 
    : (assignment?.options.find((o) => o.value === form.assignedTargetId)?.label ?? form.assignedTargetId);

  return (
    <section className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -ml-10 -mt-10" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 relative z-10">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-200 shrink-0">
            <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Partner Credentials Wizard</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
              Sleek, step-by-step account creator and dynamic profile linkage flow.
            </p>
          </div>
        </div>
        
        {/* Visual wizard steps indicators */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 p-1.5 rounded-xl shrink-0">
          {[1, 2, 3, 4].map((s) => {
            // Hide step 3 in numbering if the admin chooses to bind existing profiles
            if (s === 3 && assignment && form.assignedTargetId !== "create_new" && form.assignedTargetId !== "") return null;
            return (
              <div
                key={s}
                className={`h-6 px-2.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                  step === s
                    ? "bg-teal-600 text-white shadow-sm"
                    : step > s
                    ? "bg-teal-55 text-teal-700"
                    : "text-slate-400"
                }`}
              >
                {s === 1 ? "1. Credentials" : s === 2 ? "2. Link Profile" : s === 3 ? "3. Profile Builder" : "4. Receipt"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="mt-6 min-h-48 relative z-10">
        
        {/* Step 1: Account Credentials */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Step 1: Create login credentials</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Partner Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                  required
                />
              </div>
              
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Phone Number *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 9893xxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Email Address *</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Password (min 6) *</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Secure passcode"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Partner Role *</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                      assignedTargetId: "",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500/40 outline-none transition-all cursor-pointer"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Profile Linkage Selector */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in max-w-xl">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Step 2: Profile assignment mapping</p>
            {assignment ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Choose profile allocation for this {form.role === "auto_driver" ? "driver" : "partner"} account:
                  </label>
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-teal-600 focus:border-teal-500/40 outline-none transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Option --</option>
                    <option value="create_new" className="text-teal-600 font-bold bg-teal-50/20">
                      ✨ Setup & Create A Brand New {assignment.label} (Recommended)
                    </option>
                    {assignment.options.map((option) => (
                      <option key={option.value} value={option.value} className="text-slate-800">
                        Link Existing Profile: {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {assignment.options.length === 0 && form.assignedTargetId !== "create_new" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                    <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-[11px] text-amber-700 font-bold leading-normal">
                      No unassigned profiles exist in the directory. You must select <strong className="text-slate-900">"Setup & Create A Brand New {assignment.label}"</strong> to proceed.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs text-blue-700 font-bold">
                  No profile binding required for role: <strong>Administrator</strong>. You can skip directly to confirmation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Dynamic Profile Wizard Setup */}
        {step === 3 && assignment && form.assignedTargetId === "create_new" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Step 3: New profile builder details</p>
            <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/20 grid gap-4 md:grid-cols-3">
              {form.role !== "auto_driver" && (
                <>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Profile / Shop Name *</label>
                    <input
                      value={form.newTargetName}
                      onChange={(e) => setForm({ ...form, newTargetName: e.target.value })}
                      placeholder={form.name ? `e.g. ${form.name}'s Shop` : "e.g. Ramesh Electricals"}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Target Category *</label>
                    {assignment.categories.length === 0 ? (
                      <div className="rounded-xl border border-red-200 bg-red-55 px-4 py-2.5 text-[10px] text-red-700 leading-normal font-bold">
                        No categories found. Create a category first.
                      </div>
                    ) : (
                      <select
                        value={form.newTargetCategory}
                        onChange={(e) => setForm({ ...form, newTargetCategory: e.target.value, newTargetSubcategory: "" })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500/40 outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Select Category --</option>
                        {assignment.categories.map((cat: any) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Subcategory</label>
                    <select
                      value={form.newTargetSubcategory}
                      onChange={(e) => setForm({ ...form, newTargetSubcategory: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-teal-500/40 outline-none cursor-pointer"
                      disabled={!form.newTargetCategory}
                    >
                      <option value="">-- Choose Subcategory --</option>
                      {subcategories.map((sub: any) => (
                        <option key={sub.value} value={sub.value}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {form.role === "service_provider" && (
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Service Coverage Area</label>
                  <input
                    value={form.newTargetArea}
                    onChange={(e) => setForm({ ...form, newTargetArea: e.target.value })}
                    placeholder="e.g. Sector 5, Airport Area"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none"
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
                      placeholder="e.g. MH-12-AB-1234"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Operating Area</label>
                    <input
                      value={form.newTargetArea}
                      onChange={(e) => setForm({ ...form, newTargetArea: e.target.value })}
                      placeholder="e.g. Railway Station, Town center"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none"
                    />
                  </div>
                </>
              )}

              {/* WhatsApp Number generally applicable for all roles */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">WhatsApp Number</label>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="e.g. 9893xxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation Receipt Panel */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in max-w-xl">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Step 4: Final validation & confirmation</p>
            <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <span className="h-2 w-2 rounded-full bg-teal-500 glow-active" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Setup Action Summary Receipt</h3>
              </div>
              
              <div className="grid gap-3 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wide text-[10px]">Partner Name</span>
                  <span className="text-slate-800">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wide text-[10px]">Email Login</span>
                  <span className="text-slate-800 font-mono">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wide text-[10px]">Mobile Contact</span>
                  <span className="text-slate-800">{form.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wide text-[10px]">Access Permission</span>
                  <span className="text-teal-700 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-black uppercase">{selectedRoleLabel}</span>
                </div>
                {assignment && (
                  <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase tracking-wide text-[10px]">Profile Binding</span>
                      <span className="text-slate-800 font-black">{linkOptionLabel}</span>
                    </div>
                    {form.assignedTargetId === "create_new" && (
                      <>
                        <div className="flex justify-between pl-3 border-l-2 border-teal-200">
                          <span className="text-slate-400 text-[10px]">Auto-Created Profile</span>
                          <span className="text-slate-850 font-bold">{form.newTargetName || form.name}</span>
                        </div>
                        {form.whatsapp && (
                          <div className="flex justify-between pl-3 border-l-2 border-teal-200">
                            <span className="text-slate-400 text-[10px]">WhatsApp</span>
                            <span className="text-slate-850 font-mono">{form.whatsapp}</span>
                          </div>
                        )}
                        {form.role !== "auto_driver" ? (
                          <div className="flex justify-between pl-3 border-l-2 border-teal-200">
                            <span className="text-slate-400 text-[10px]">Scope Category</span>
                            <span className="text-slate-850">{form.newTargetCategory}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between pl-3 border-l-2 border-teal-200">
                            <span className="text-slate-400 text-[10px]">Vehicle Number</span>
                            <span className="text-slate-850 font-mono">{form.newTargetVehicleNumber}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Row */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 relative z-10">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
            >
              &larr; Previous Step
            </button>
          )}
        </div>

        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-teal-600 px-5 py-3 text-xs font-black tracking-wide text-white hover:bg-teal-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              Continue Next &rarr;
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={createPartner}
              className="rounded-xl bg-teal-600 px-6 py-3 text-xs font-black tracking-wide text-white hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {saving ? "Deploying Account..." : "Confirm & Link Account"}
            </button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {message && (
        <div className="mt-4 rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2.5 shadow-sm relative z-10 animate-pulse">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2.5 shadow-sm relative z-10 animate-shake">
          <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
    </section>
  );
}
