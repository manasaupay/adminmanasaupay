"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import type { AdminTableConfig } from "@/lib/admin-tables";
import {
  callReadinessBadgeClass,
  callReadinessLabel,
  getPartnerCallReadiness,
  isPartnerRole,
  missingPermissionHints,
  type PartnerCallReadiness,
} from "@/lib/partner-call-permissions";
import { SendNotificationButton } from "./send-notification-button";
import { ManageServicesModal } from "./manage-services-modal";

type Row = Record<string, unknown>;
type EditableRow = Record<string, string | boolean>;
type Option = { value: string; label: string };
type OptionMap = Record<string, Option[]>;

const IMAGE_SIZE_GUIDE: Record<string, Record<string, string>> = {
  businesses: {
    cover_image: "Recommended: 1200 x 600 px (2:1 Landscape) for premium look.",
    logo_url: "Recommended: 200 x 200 px (1:1 Square) for store avatars.",
  },
  services: {
    short_description: "Recommended: 400 x 405 px profile avatar.",
  },
  categories: {
    icon_url: "Recommended: 128 x 128 px transparent background PNG.",
    banner_url: "Recommended: 800 x 400 px subcategory banner.",
  },
  ads: {
    image_url: "Slider Ad: 1000x500px (2:1). Inline Ad: 800x300px. Search Ad: 600x150px.",
  },
  sponsored_shops: {
    banner_url: "Recommended: 800 x 400 px category sponsorship banner.",
  },
  notifications: {
    image: "Recommended: 600 x 300 px banner image for notifications.",
  },
  updates: {
    image: "Recommended: 800 x 400 px announcement card image.",
  },
  news: {
    image_url: "Recommended: 800 x 450 px (16:9) article thumbnail.",
  },
  events: {
    banner_url: "Recommended: 1000 x 500 px event promotion banner.",
  },
  offers: {
    banner_url: "Recommended: 800 x 400 px discount card banner.",
  },
  properties: {
    image_url: "Recommended: 900 x 600 px (3:2) property photograph.",
  },
  resale: {
    image_url: "Recommended: 600 x 600 px (1:1) listing photo.",
  },
  products: {
    image_url: "Recommended: 600 x 600 px (1:1) product item catalog image.",
  },
};

const TABLE_EXPLANATIONS: Record<string, string> = {
  users: "Displays all accounts registered. Partner rows show Call Status badges: Call Ready, Needs Permission Fix, or Not Synced Yet.",
  businesses: "Shops and corporate listings in Manasa. Toggle featured status to pin them, or sponsored for search priority.",
  services: "Individual technicians (plumbers, electricians, RO repair). Manage category indexing and verification.",
  auto_drivers: "Hyperlocal auto booking driver directory. Control availability and assigned service areas.",
  jobs: "Open job vacancies posted. Sponsored jobs are promoted on user feeds.",
  categories: "Cascading service and shop category filters. Hierarchy is controlled via parent keys.",
  ads: "App marketing slots. Set placements (slider, inline, search-results) and toggle status.",
  sponsored_shops: "Shops featured inside specific category listings.",
  notifications: "Broadcast push notifications via FCM. Approved listings will automatically trigger alerts.",
  updates: "Local notices, emergency announcements, and municipal notices.",
  news: "Hyperlocal news bulletins and articles.",
  events: "Community programs, festivals, and business events.",
  offers: "Local vendor deals, discount coupons, and sales.",
  properties: "Real estate properties for rent or sale.",
  resale: "Marketplace listings for second-hand items.",
  products: "Store product inventory catalogs.",
  settings: "Platform-wide environment control key-value overrides.",
};

function nestedValue(row: Row, key: string) {
  if (!key.includes(".")) return row[key];
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, row);
}

function assignNested(payload: Record<string, unknown>, key: string, value: unknown) {
  const parts = key.split(".");
  const root = parts.shift();
  if (!root) return;
  if (parts.length === 0) {
    payload[root] = value;
    return;
  }
  const existing = payload[root];
  const target =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    const next = cursor[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  });
  payload[root] = target;
}

function createBlankRow(config: AdminTableConfig): EditableRow {
  const row: EditableRow = {};
  config.columns.forEach((column) => {
    if (column.key.startsWith("_")) return;
    row[column.key] = column.type === "boolean" ? false : "";
  });
  if (config.approveField) row[config.approveField] = false;
  if (config.featuredField) row[config.featuredField] = false;
  if (config.activeField) row[config.activeField] = true;
  if (config.availabilityField) row[config.availabilityField] = true;
  return row;
}

function createEditableRow(config: AdminTableConfig, row: Row): EditableRow {
  const editable: EditableRow = {};
  config.columns.forEach((column) => {
    if (column.key.startsWith("_")) return;
    const value = nestedValue(row, column.key);
    if (column.type === "date") {
      editable[column.key] = value === null || value === undefined ? "" : String(value).slice(0, 10);
    } else if (column.type === "json") {
      try {
        editable[column.key] = value === null || value === undefined ? "" : JSON.stringify(value, null, 2);
      } catch {
        editable[column.key] = value === null || value === undefined ? "" : String(value);
      }
    } else if (column.type === "boolean") {
      editable[column.key] = Boolean(value);
    } else {
      editable[column.key] = value === null || value === undefined ? "" : String(value);
    }

    if (column.optionSource === "businesses") {
      if (!value || value === "") {
        const meta = row.meta;
        let businessName = "";
        if (meta && typeof meta === "object") {
          businessName = (meta as Record<string, unknown>).business_name as string || "";
        } else if (meta && typeof meta === "string") {
          try {
            const parsed = JSON.parse(meta);
            businessName = parsed.business_name || "";
          } catch {
            // Ignore
          }
        }
        if (businessName) {
          editable[column.key] = "__manual__";
          editable[`${column.key}_manual_name`] = businessName;
        } else {
          editable[`${column.key}_manual_name`] = "";
        }
      } else {
        editable[`${column.key}_manual_name`] = "";
      }
    }
  });
  if (config.approveField) editable[config.approveField] = Boolean(row[config.approveField]);
  if (config.featuredField) editable[config.featuredField] = Boolean(row[config.featuredField]);
  if (config.activeField) editable[config.activeField] = Boolean(row[config.activeField]);
  if (config.availabilityField) editable[config.availabilityField] = Boolean(row[config.availabilityField]);
  return editable;
}

export function SupabaseCrudTable({ config }: { config: AdminTableConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [managingUserName, setManagingUserName] = useState<string>("");

  // Modals & Sliders states
  const [showInfo, setShowInfo] = useState(false);
  const [activeFormRowId, setActiveFormRowId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditableRow>({});
  
  // Advanced Navigation & Query State
  const [query, setQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "active">("all");
  const [callPermissionFilter, setCallPermissionFilter] = useState<
    "all" | "partners" | PartnerCallReadiness
  >("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => config.columns.map((c) => c.key));
  const [showColPicker, setShowColPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [dynamicOptions, setDynamicOptions] = useState<OptionMap>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${config.key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error syncing database");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/options")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setDynamicOptions(data);
      })
      .catch(() => setDynamicOptions({}));
  }, []);

  async function patch(id: string, updates: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      let payload = updates;
      // If updating from form dialog, prepare standard nested payload
      if (updates._isForm) {
        const { _isForm, ...cleanUpdates } = updates;
        payload = preparePayload(cleanUpdates as EditableRow);
      }
      
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      
      setActiveFormRowId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving updates");
    } finally {
      setSaving(false);
    }
  }

  async function create(values: EditableRow) {
    setSaving(true);
    setError(null);
    try {
      const payload = preparePayload(values);
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to insert record");
      
      setActiveFormRowId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creating entry");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete row");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error deleting entry");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenForm(id: string | null, row?: Row) {
    setActiveFormRowId(id);
    if (id === "new") {
      setFormData(createBlankRow(config));
    } else if (row) {
      setFormData(createEditableRow(config, row));
    }
  }

  function updateFormValue(key: string, value: string | boolean) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function formatValue(value: unknown, column?: AdminTableConfig["columns"][number]) {
    if (value === null || value === undefined) return "";
    const strVal = String(value);
    if (column?.optionSource) {
      const opts = dynamicOptions[column.optionSource] ?? [];
      const match = opts.find((o) => o.value === strVal);
      if (match) return match.label;
    }
    return strVal;
  }

  function optionsFor(column: AdminTableConfig["columns"][number]) {
    const list = [];
    if (column.optionSource) {
      list.push(...(dynamicOptions[column.optionSource] ?? []));
    } else {
      list.push(...(column.options?.map((option) => ({ value: option, label: option })) ?? []));
    }

    if (column.optionSource === "businesses") {
      list.push({ value: "__manual__", label: "✏️ Add Manually (Custom Business)" });
    }
    return list;
  }

  function preparePayload(values: EditableRow): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    
    // Extract or parse existing meta
    let metaObj: Record<string, unknown> = {};
    if (values['meta']) {
      try {
        metaObj = typeof values['meta'] === 'string'
          ? JSON.parse(values['meta'])
          : (values['meta'] as unknown as Record<string, unknown>);
      } catch {
        // Ignore
      }
    }

    config.columns.forEach((col) => {
      if (col.key.startsWith("_")) return;
      const raw = values[col.key];
      if (raw === undefined) return;
      const write = (value: unknown) => {
        if (col.key.includes(".")) assignNested(payload, col.key, value);
        else payload[col.key] = value;
      };
      
      if (col.optionSource === "businesses" && raw === "__manual__") {
        write(null);
        const manualName = values[`${col.key}_manual_name`] || "";
        if (manualName) {
          metaObj.business_name = manualName;
        }
      } else if (raw === "") {
        write(null);
      } else if (col.type === "json") {
        try {
          write(JSON.parse(String(raw)));
        } catch {
          write(String(raw));
        }
      } else if (col.type === "date") {
        write(String(raw));
      } else if (col.type === "boolean") {
        write(Boolean(raw));
      } else {
        write(raw);
      }
    });

    if (Object.keys(metaObj).length > 0) {
      payload['meta'] = {
        ...((payload['meta'] as Record<string, unknown> | undefined) ?? {}),
        ...metaObj,
      };
    }

    if (config.approveField && values[config.approveField] !== undefined) payload[config.approveField] = values[config.approveField];
    if (config.featuredField && values[config.featuredField] !== undefined) payload[config.featuredField] = values[config.featuredField];
    if (config.activeField && values[config.activeField] !== undefined) payload[config.activeField] = values[config.activeField];
    if (config.availabilityField && values[config.availabilityField] !== undefined) payload[config.availabilityField] = values[config.availabilityField];
    return payload;
  }

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortDirection("asc");
    }
  };

  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const exportToCSV = () => {
    if (filteredAndSortedRows.length === 0) return;
    const headers = config.columns.map((c) => c.label).join(",");
    const bodyRows = filteredAndSortedRows.map((row) =>
      config.columns
        .map((c) => {
          const val = nestedValue(row, c.key);
          const escaped = String(val ?? "").replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...bodyRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${config.key}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Row filtering and sorting computation
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Status filter
    if (statusFilter === "pending" && config.approveField) {
      result = result.filter((row) => row[config.approveField!] === false || row[config.approveField!] === null);
    } else if (statusFilter === "approved" && config.approveField) {
      result = result.filter((row) => row[config.approveField!] === true);
    } else if (statusFilter === "active" && config.activeField) {
      result = result.filter((row) => row[config.activeField!] === true);
    }

    if (config.key === "users" && callPermissionFilter !== "all") {
      result = result.filter((row) => {
        const readiness = getPartnerCallReadiness(row);
        if (callPermissionFilter === "partners") {
          return isPartnerRole(row.role);
        }
        return readiness === callPermissionFilter;
      });
    }

    // Global query search
    if (query.trim() !== "") {
      const q = query.toLowerCase().trim();
      result = result.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(q)
      );
    }

    // Column specific filters
    Object.keys(columnFilters).forEach((key) => {
      const val = columnFilters[key]?.trim().toLowerCase();
      if (!val) return;
      result = result.filter((row) => {
        const cell = nestedValue(row, key);
        return String(cell ?? "").toLowerCase().includes(val);
      });
    });

    // Sort order
    if (sortField) {
      result.sort((a, b) => {
        let valA =
          sortField === "_call_readiness"
            ? getPartnerCallReadiness(a)
            : nestedValue(a, sortField);
        let valB =
          sortField === "_call_readiness"
            ? getPartnerCallReadiness(b)
            : nestedValue(b, sortField);
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [rows, query, columnFilters, statusFilter, callPermissionFilter, sortField, sortDirection, config]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedRows, currentPage, itemsPerPage]);

  const pendingCount = config.approveField
    ? rows.filter((row) => row[config.approveField!] === false || row[config.approveField!] === null).length
    : 0;

  const approvedCount = config.approveField
    ? rows.filter((row) => row[config.approveField!] === true).length
    : rows.length;

  const activeCount = config.activeField
    ? rows.filter((row) => row[config.activeField!] === true).length
    : rows.length;

  const partnerCallReadyCount =
    config.key === "users"
      ? rows.filter((row) => getPartnerCallReadiness(row) === "call_ready").length
      : 0;

  const partnerNeedsFixCount =
    config.key === "users"
      ? rows.filter((row) => {
          const status = getPartnerCallReadiness(row);
          return status === "needs_fix" || status === "not_synced";
        }).length
      : 0;

  return (
    <div className="space-y-6">
      {/* Title block with info icon */}
      <div className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 relative">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">{config.title}</h1>
                <button
                  onClick={() => setShowInfo(true)}
                  title="Show Info & Guidelines"
                  className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5 text-teal-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={load}
                  disabled={loading}
                  title="Sync from Supabase"
                  className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg className={`h-4 w-4 ${loading ? 'animate-spin text-teal-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{config.description}</p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => handleOpenForm("new")}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white hover:bg-teal-700 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add New Record
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredAndSortedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <SendNotificationButton section={config.sectionKey} />
          </div>
        </div>

        {/* Dynamic platform metrics */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.key === "users" ? "Total Users" : "Total Entries"}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.key === "users"
                ? "Call Ready Partners"
                : config.approveField
                  ? "Pending Approval"
                  : "Active In-app"}
            </p>
            <p
              className={`mt-1 text-2xl font-black ${
                config.key === "users"
                  ? "text-emerald-600"
                  : config.approveField && pendingCount > 0
                    ? "text-amber-600 animate-pulse"
                    : "text-emerald-600"
              }`}
            >
              {config.key === "users"
                ? partnerCallReadyCount
                : config.approveField
                  ? pendingCount
                  : activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.key === "users" ? "Needs Permission Fix" : "Showing Filtered"}
            </p>
            <p
              className={`mt-1 text-2xl font-black ${
                config.key === "users"
                  ? partnerNeedsFixCount > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                  : "text-teal-600"
              }`}
            >
              {config.key === "users" ? partnerNeedsFixCount : filteredAndSortedRows.length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm flex items-center gap-2">
          <svg className="h-5 w-5 text-red-650 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-extrabold">System Notice</p>
            <p className="font-medium mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 justify-center">
          <span className="h-4 w-4 rounded-full bg-teal-500 glow-active shadow-[0_0_12px_rgba(20,184,166,0.4)] animate-pulse" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing data from Supabase...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
          {/* Table Header Filter controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/20">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              {/* Global search */}
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-3 text-slate-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search all fields...`}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                />
              </div>

              {/* Column Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  showColumnFilters
                    ? "bg-teal-50 border-teal-150 text-teal-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showColumnFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap relative">
              {/* Column picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColPicker(!showColPicker)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Columns
                </button>
                {showColPicker && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-30 space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Show/Hide Columns</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {config.columns.map((c) => (
                        <label key={c.key} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(c.key)}
                            onChange={() => toggleColumnVisibility(c.key)}
                            className="h-4 w-4 rounded border-slate-200 text-teal-600 focus:ring-0"
                          />
                          <span>{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status filtering tabs */}
              <div className="flex gap-1 border border-slate-150 bg-slate-150 p-1 rounded-xl">
                {(["all", "pending", "approved", "active"] as const).map((filter) => {
                  if ((filter === "pending" || filter === "approved") && !config.approveField) return null;
                  if (filter === "active" && !config.activeField) return null;
                  const active = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        active
                          ? "bg-white text-teal-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-slate-150"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              {config.key === "users" && (
                <div className="flex flex-wrap gap-1 border border-slate-150 bg-slate-150 p-1 rounded-xl">
                  {(
                    [
                      ["all", "All Users"],
                      ["partners", "Partners"],
                      ["call_ready", "Call Ready"],
                      ["needs_fix", "Needs Fix"],
                      ["not_synced", "Not Synced"],
                    ] as const
                  ).map(([filter, label]) => {
                    const active = callPermissionFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setCallPermissionFilter(filter);
                          setCurrentPage(1);
                        }}
                        className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          active
                            ? "bg-white text-teal-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-slate-150"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  {config.columns.map((c) => {
                    if (!visibleColumns.includes(c.key)) return null;
                    const isSorted = sortField === c.key;
                    return (
                      <th
                        key={c.key}
                        onClick={() => handleSort(c.key)}
                        className="px-5 py-4 font-black uppercase tracking-wider text-[10px] cursor-pointer hover:bg-slate-100/50 hover:text-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{c.label}</span>
                          <span className={`text-[9px] ${isSorted ? "text-teal-600" : "text-slate-300"}`}>
                            {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px]">Actions</th>
                  {config.approveField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Approved</th>}
                  {config.featuredField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Featured</th>}
                  {config.activeField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Active</th>}
                  {config.availabilityField && <th className="px-5 py-4 font-black uppercase tracking-wider text-[10px] text-center">Available</th>}
                </tr>

                {/* Inline filter inputs */}
                {showColumnFilters && (
                  <tr className="bg-slate-100/20 border-b border-slate-100 animate-fade-in">
                    {config.columns.map((c) => {
                      if (!visibleColumns.includes(c.key)) return null;
                      return (
                        <td key={`filter-${c.key}`} className="px-4 py-2">
                          <input
                            type="text"
                            value={columnFilters[c.key] ?? ""}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [c.key]: e.target.value,
                              }))
                            }
                            placeholder={`Filter ${c.label}`}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 placeholder-slate-400 focus:border-teal-500/40 outline-none transition-all"
                          />
                        </td>
                      );
                    })}
                    <td className="px-5 py-2">
                      <button
                        onClick={() => setColumnFilters({})}
                        className="text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        Reset All
                      </button>
                    </td>
                    {config.approveField && <td />}
                    {config.featuredField && <td />}
                    {config.activeField && <td />}
                    {config.availabilityField && <td />}
                  </tr>
                )}
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row) => {
                  const id = String(row.id);
                  return (
                    <tr key={id} className="hover:bg-slate-50/40 transition-colors">
                      {config.columns.map((c) => {
                        if (!visibleColumns.includes(c.key)) return null;
                        const rawValue = nestedValue(row, c.key);
                        return (
                          <td key={c.key} className="px-5 py-3 max-w-xs truncate font-medium text-slate-700">
                            {c.key === "_call_readiness" ? (
                              (() => {
                                const readiness = getPartnerCallReadiness(row);
                                if (readiness === "not_partner") {
                                  return <span className="text-slate-400">—</span>;
                                }
                                return (
                                  <div className="space-y-1">
                                    <span
                                      className={`badge-status ${callReadinessBadgeClass(readiness)}`}
                                      title={missingPermissionHints(row)}
                                    >
                                      {callReadinessLabel(readiness)}
                                    </span>
                                    {readiness !== "call_ready" && (
                                      <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                        {missingPermissionHints(row)}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()
                            ) : c.type === "image" ? (
                              rawValue && String(rawValue).startsWith("http") ? (
                                <a href={String(rawValue)} target="_blank" rel="noreferrer" className="flex items-center gap-2 group cursor-pointer">
                                  <div className="h-8 w-12 rounded border border-slate-200 overflow-hidden bg-slate-50 shadow-sm shrink-0 transition-transform group-hover:scale-105">
                                    <img src={String(rawValue)} className="h-full w-full object-cover" alt="img" />
                                  </div>
                                  <span className="text-[10px] text-teal-600 font-bold group-hover:underline">View</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            ) : c.type === "boolean" ? (
                              <span className={`badge-status ${rawValue ? "badge-approved" : "badge-blocked"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${rawValue ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {rawValue ? "Yes" : "No"}
                              </span>
                            ) : c.key === "role" ? (
                              <span className={`badge-status ${
                                rawValue === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                rawValue === "business" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                rawValue === "service_provider" ? "bg-teal-50 text-teal-700 border-teal-200" :
                                "bg-slate-50 text-slate-700 border-slate-200"
                              }`}>
                                {String(rawValue)}
                              </span>
                            ) : c.type === "json" ? (
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {rawValue ? "JSON Data" : "Empty"}
                              </span>
                            ) : (
                              formatValue(rawValue, c)
                            )}
                          </td>
                        );
                      })}
                      
                      {/* Read-Only action buttons */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenForm(id, row)}
                            className="rounded-lg bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 border border-slate-200 transition-all duration-150 cursor-pointer shadow-sm active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              if (confirm("Permanently delete this entry?")) remove(id);
                            }}
                            className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-100 transition-all duration-150 cursor-pointer active:scale-95"
                          >
                            Delete
                          </button>
                          {config.key === "users" && (nestedValue(row, "role") === "service_provider" || nestedValue(row, "role") === "business") && (
                            <button
                              type="button"
                              onClick={() => {
                                setManagingUserId(id);
                                setManagingUserName(String(row.name || "User"));
                              }}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 hover:bg-blue-100 transition-all duration-150 cursor-pointer shadow-sm"
                            >
                              Services
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Fast Toggle switch fields in cells */}
                      {config.approveField && (
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => patch(id, { [config.approveField!]: !Boolean(row[config.approveField!]) })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              row[config.approveField!] ? "bg-emerald-600" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                row[config.approveField!] ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      )}
                      {config.featuredField && (
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => patch(id, { [config.featuredField!]: !Boolean(row[config.featuredField!]) })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              row[config.featuredField!] ? "bg-teal-600" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                row[config.featuredField!] ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      )}
                      {config.activeField && (
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => patch(id, { [config.activeField!]: !Boolean(row[config.activeField!]) })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              row[config.activeField!] ? "bg-teal-600" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                row[config.activeField!] ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      )}
                      {config.availabilityField && (
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => patch(id, { [config.availabilityField!]: !Boolean(row[config.availabilityField!]) })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              row[config.availabilityField!] ? "bg-teal-600" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                row[config.availabilityField!] ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAndSortedRows.length === 0 && !error && (
              <div className="p-16 text-center text-xs font-bold text-slate-400">
                <svg className="mx-auto h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No entries found. Click &quot;Add New Record&quot; to build a listing.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 p-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Show per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={10}>10 records</option>
                <option value={25}>25 records</option>
                <option value={50}>50 records</option>
              </select>
              <span className="text-xs text-slate-400 font-semibold ml-2">
                Showing {filteredAndSortedRows.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedRows.length)} of {filteredAndSortedRows.length} entries
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-750 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = currentPage === pageNum;
                if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={`dots-${pageNum}`} className="text-slate-300 px-1 text-xs">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                      isCurrent
                        ? "bg-teal-600 text-white shadow-sm border border-teal-600"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-750 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 2-Column Responsive Form Modal (Laptop squishing fix) */}
      {activeFormRowId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-2xl animate-scale-up space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {activeFormRowId === "new" ? `Create New ${config.title.replace(" Management", "")}` : `Edit ${config.title.replace(" Management", "")} Entry`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit properties and metadata configurations.</p>
              </div>
              <button
                onClick={() => setActiveFormRowId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Fields Grid: 2 Columns on Laptop/Desktop */}
            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.columns
                .filter((col) => !col.key.startsWith("_"))
                .map((col) => {
                const guideText = IMAGE_SIZE_GUIDE[config.key]?.[col.key];
                return (
                  <div key={col.key} className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1">
                      {col.label}
                    </label>

                    {((col.type === "enum" && col.options) || col.optionSource) ? (
                      <div className="space-y-1.5">
                        <select
                          value={String(formData[col.key] ?? "")}
                          onChange={(e) => updateFormValue(col.key, e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 focus:border-teal-500/40 focus:bg-white outline-none transition-all cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                        >
                          <option value="">-- Select --</option>
                          {optionsFor(col).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {col.optionSource === "businesses" && formData[col.key] === "__manual__" && (
                          <input
                            type="text"
                            value={String(formData[`${col.key}_manual_name`] ?? "")}
                            onChange={(e) => updateFormValue(`${col.key}_manual_name`, e.target.value)}
                            placeholder="Enter Custom Business Name"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 outline-none transition-all"
                          />
                        )}
                      </div>
                    ) : col.type === "boolean" ? (
                      <div className="pt-2 flex items-center">
                        <button
                          type="button"
                          onClick={() => updateFormValue(col.key, !Boolean(formData[col.key]))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData[col.key] ? "bg-teal-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formData[col.key] ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ) : col.type === "json" ? (
                      <textarea
                        value={String(formData[col.key] ?? "")}
                        onChange={(e) => updateFormValue(col.key, e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-850 placeholder-slate-400 focus:border-teal-500/40 focus:bg-white outline-none transition-all font-mono"
                      />
                    ) : col.type === "image" ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={String(formData[col.key] ?? "")}
                          onChange={(e) => updateFormValue(col.key, e.target.value)}
                          placeholder="Paste image URL here..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:bg-white outline-none transition-all"
                        />
                        {guideText && (
                          <p className="text-[10px] font-bold text-teal-600 tracking-wide">{guideText}</p>
                        )}
                        {/* Live Image preview block inside the form */}
                        {formData[col.key] && String(formData[col.key]).startsWith("http") && (
                          <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="h-16 w-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <img src={String(formData[col.key])} className="h-full w-full object-cover" alt="live preview" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Live Image Preview</p>
                              <a href={String(formData[col.key])} target="_blank" rel="noreferrer" className="text-[10px] text-teal-600 font-bold hover:underline block mt-0.5">Open URL &rarr;</a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={col.type === "date" ? "date" : "text"}
                        value={String(formData[col.key] ?? "")}
                        onChange={(e) => updateFormValue(col.key, e.target.value)}
                        placeholder={`Enter ${col.label}`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:bg-white outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    )}
                  </div>
                );
              })}

              {/* Status toggles at the bottom of the form */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                {config.approveField && (
                  <label className="flex items-center gap-2.5 text-xs font-black text-slate-600 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => updateFormValue(config.approveField!, !Boolean(formData[config.approveField!]))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData[config.approveField!] ? "bg-emerald-605" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData[config.approveField!] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span>Approved</span>
                  </label>
                )}
                {config.featuredField && (
                  <label className="flex items-center gap-2.5 text-xs font-black text-slate-600 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => updateFormValue(config.featuredField!, !Boolean(formData[config.featuredField!]))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData[config.featuredField!] ? "bg-teal-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData[config.featuredField!] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span>Featured</span>
                  </label>
                )}
                {config.activeField && (
                  <label className="flex items-center gap-2.5 text-xs font-black text-slate-600 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => updateFormValue(config.activeField!, !Boolean(formData[config.activeField!]))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData[config.activeField!] ? "bg-teal-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData[config.activeField!] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span>Active</span>
                  </label>
                )}
                {config.availabilityField && (
                  <label className="flex items-center gap-2.5 text-xs font-black text-slate-600 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => updateFormValue(config.availabilityField!, !Boolean(formData[config.availabilityField!]))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData[config.availabilityField!] ? "bg-teal-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData[config.availabilityField!] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span>Available</span>
                  </label>
                )}
              </div>
            </form>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setActiveFormRowId(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (activeFormRowId === "new") {
                    create(formData);
                  } else {
                    patch(activeFormRowId, { ...formData, _isForm: true });
                  }
                }}
                className="rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-black text-white hover:bg-teal-700 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {saving ? "Processing..." : (activeFormRowId === "new" ? "Create Record" : "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sliding Information Guide Drawer */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col justify-between animate-slide-in-right overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900">{config.title} Guide</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Module Operations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="font-extrabold text-slate-800 text-xs">Section Purpose</p>
                  <p className="mt-1 text-slate-500 font-semibold">{TABLE_EXPLANATIONS[config.key] ?? "Manage listing data and state configurations."}</p>
                </div>

                <div className="space-y-2">
                  <p className="font-extrabold text-slate-850">Recommended Image Guidelines</p>
                  <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 bg-white">
                    {config.columns.filter(c => c.type === "image").map(c => {
                      const sizeGuide = IMAGE_SIZE_GUIDE[config.key]?.[c.key] ?? "No size limit. Use optimized web formats (PNG/WebP).";
                      return (
                        <div key={c.key} className="p-3">
                          <p className="font-bold text-slate-800 uppercase text-[9px] tracking-wide">{c.label} Image Size</p>
                          <p className="text-[11px] text-teal-600 font-bold mt-0.5">{sizeGuide}</p>
                        </div>
                      );
                    })}
                    {config.columns.filter(c => c.type === "image").length === 0 && (
                      <p className="p-4 text-slate-400 font-medium text-center">No image fields are required for this table.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="font-extrabold text-slate-800 text-xs">Admin Actions Explanation</p>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-500 font-medium">
                    <li><strong className="text-slate-700">Fast Toggles:</strong> Enable/Disable active or approval status directly inside the listing rows for instant results.</li>
                    <li><strong className="text-slate-700">Save / Edit Dialog:</strong> Opens a 2-column laptop-spacious grid to modify all fields cleanly.</li>
                    <li><strong className="text-slate-700">Delete Action:</strong> Deletes entry permanently from database. Use with caution.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-8 w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800 cursor-pointer text-center"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {managingUserId && (
        <ManageServicesModal
          userId={managingUserId}
          userName={managingUserName}
          isOpen={!!managingUserId}
          onClose={() => {
            setManagingUserId(null);
            setManagingUserName("");
          }}
        />
      )}
    </div>
  );
}
