"use client";

import { useEffect, useMemo, useState } from "react";

const roles = [
  { value: "business", label: "Business Partner" },
  { value: "service_provider", label: "Service Provider" },
  { value: "auto_driver", label: "Auto Driver" },
  { value: "admin", label: "Admin" },
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

  async function createPartner() {
    if (assignment && !form.assignedTargetId) {
      setError(`Select ${assignment.label} before creating login.`);
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
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create partner");
      setMessage(`Partner created: ${data.email}`);
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Create partner login
          </h2>
          <p className="text-sm text-slate-600">
            These credentials work in the app Profile partner login.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={createPartner}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create login"}
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-6">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          type="password"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) =>
            setForm({
              ...form,
              role: e.target.value,
              assignedTargetId: "",
            })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        {assignment && (
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
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 font-medium"
            required
          >
            <option value="">Select {assignment.label}</option>
            <option value="create_new" className="text-emerald-700 font-semibold">+ Create New {assignment.label}</option>
            {assignment.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {assignment && form.assignedTargetId === "create_new" && (
        <div className="mt-4 p-4 border border-emerald-200 rounded-lg bg-emerald-50/50 grid gap-3 md:grid-cols-3">
          <div className="col-span-3">
            <h3 className="text-sm font-semibold text-emerald-950">
              New {assignment.label} Details
            </h3>
            <p className="text-xs text-emerald-800">
              This profile will be created and linked to this partner account automatically.
            </p>
          </div>
          {form.role !== "auto_driver" && (
            <>
              <input
                value={form.newTargetName}
                onChange={(e) => setForm({ ...form, newTargetName: e.target.value })}
                placeholder={`${assignment.label} Name (optional - defaults to partner name)`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 col-span-1"
              />
              <select
                value={form.newTargetCategory}
                onChange={(e) => setForm({ ...form, newTargetCategory: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 col-span-1"
                required
              >
                <option value="">Select Category *</option>
                {assignment.categories.map((cat: any) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <input
                value={form.newTargetSubcategory}
                onChange={(e) => setForm({ ...form, newTargetSubcategory: e.target.value })}
                placeholder="Subcategory (optional, e.g. AC, Plumbing)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 col-span-1"
              />
            </>
          )}
          {form.role === "service_provider" && (
            <input
              value={form.newTargetArea}
              onChange={(e) => setForm({ ...form, newTargetArea: e.target.value })}
              placeholder="Service Area (optional, e.g. Sector 5)"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 col-span-1"
            />
          )}
          {form.role === "auto_driver" && (
            <>
              <input
                value={form.newTargetVehicleNumber}
                onChange={(e) => setForm({ ...form, newTargetVehicleNumber: e.target.value })}
                placeholder="Vehicle Number * (e.g. MH12AB1234)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 col-span-1"
                required
              />
              <input
                value={form.newTargetArea}
                onChange={(e) => setForm({ ...form, newTargetArea: e.target.value })}
                placeholder="Service Area (optional, e.g. Sector 5)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 col-span-1"
              />
            </>
          )}
        </div>
      )}

      {assignment && assignment.options.length === 0 && form.assignedTargetId !== "create_new" && (
        <p className="mt-3 text-sm text-amber-700">
          No unassigned {assignment.label.toLowerCase()} found. Select "+ Create New" to create one automatically or unassign an existing one.
        </p>
      )}
      {message && <p className="mt-3 text-sm text-emerald-700 font-semibold">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700 font-semibold">{error}</p>}
    </section>
  );
}
