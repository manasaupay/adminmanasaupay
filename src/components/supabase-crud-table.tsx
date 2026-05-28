"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import type { AdminTableConfig } from "@/lib/admin-tables";
import { SendNotificationButton } from "./send-notification-button";

type Row = Record<string, unknown>;
type EditableRow = Record<string, string | boolean>;
type Option = { value: string; label: string };
type OptionMap = Record<string, Option[]>;

function createEditableRow(config: AdminTableConfig, row: Row): EditableRow {
  const editable: EditableRow = {};
  config.columns.forEach((column) => {
    const value = row[column.key];
    if (column.type === "date") {
      editable[column.key] = value === null || value === undefined ? "" : String(value).slice(0, 10);
    } else if (column.type === "json") {
      try {
        editable[column.key] = value === null || value === undefined ? "" : JSON.stringify(value);
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
  const [editingRows, setEditingRows] = useState<Record<string, EditableRow>>({});
  
  // Advanced Navigation & Query State
  const [query, setQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "active">("all");
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
      const editingMap: Record<string, EditableRow> = {};
      (Array.isArray(data) ? data : []).forEach((row: Row) => {
        if (row.id === undefined || row.id === null) return;
        editingMap[String(row.id)] = createEditableRow(config, row);
      });
      setEditingRows(editingMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setRows([]);
      setEditingRows({});
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
      const payload = preparePayload(updates as EditableRow);
      const res = await fetch(`/api/admin/${config.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save changes");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
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
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function updateRowValue(id: string, key: string, value: string | boolean) {
    setEditingRows((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [key]: value,
      },
    }));
  }

  function formatValue(value: unknown) {
    return value === null || value === undefined ? "" : String(value);
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
      const raw = values[col.key];
      if (raw === undefined) return;
      
      if (col.optionSource === "businesses" && raw === "__manual__") {
        payload[col.key] = null;
        const manualName = values[`${col.key}_manual_name`] || "";
        if (manualName) {
          metaObj.business_name = manualName;
        }
      } else if (raw === "") {
        payload[col.key] = null;
      } else if (col.type === "json") {
        try {
          payload[col.key] = JSON.parse(String(raw));
        } catch {
          payload[col.key] = String(raw);
        }
      } else if (col.type === "date") {
        payload[col.key] = String(raw);
      } else if (col.type === "boolean") {
        payload[col.key] = Boolean(raw);
      } else {
        payload[col.key] = raw;
      }
    });

    if (Object.keys(metaObj).length > 0) {
      payload['meta'] = metaObj;
    }

    if (config.approveField && values[config.approveField] !== undefined) payload[config.approveField] = values[config.approveField];
    if (config.featuredField && values[config.featuredField] !== undefined) payload[config.featuredField] = values[config.featuredField];
    if (config.activeField && values[config.activeField] !== undefined) payload[config.activeField] = values[config.activeField];
    if (config.availabilityField && values[config.availabilityField] !== undefined) payload[config.availabilityField] = values[config.availabilityField];
    return payload;
  }

  // Sort mechanism
  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortDirection("asc");
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // CSV Export utility
  const exportToCSV = () => {
    if (filteredAndSortedRows.length === 0) return;
    const headers = config.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const csvContent = filteredAndSortedRows.map((row) =>
      config.columns
        .map((c) => {
          const val = row[c.key];
          const str = val === null || val === undefined ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const blob = new Blob([[headers, ...csvContent].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${config.key}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply sorting, searching, and filtering
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Status filter
    if (statusFilter === "pending" && config.approveField) {
      result = result.filter((row) => row[config.approveField!] === false);
    } else if (statusFilter === "approved" && config.approveField) {
      result = result.filter((row) => row[config.approveField!] === true);
    } else if (statusFilter === "active" && config.activeField) {
      result = result.filter((row) => row[config.activeField!] === true);
    }

    // Global query search
    if (query.trim() !== "") {
      const q = query.toLowerCase().trim();
      result = result.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(q)
      );
    }

    // Column-specific searches
    Object.entries(columnFilters).forEach(([colKey, filterVal]) => {
      if (filterVal.trim() !== "") {
        const f = filterVal.toLowerCase().trim();
        result = result.filter((row) => {
          const val = row[colKey];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(f);
        });
      }
    });

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comp = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          comp = valA - valB;
        } else if (typeof valA === "boolean" && typeof valB === "boolean") {
          comp = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comp = String(valA).localeCompare(String(valB));
        }
        return sortDirection === "asc" ? comp : -comp;
      });
    }

    return result;
  }, [rows, query, columnFilters, statusFilter, sortField, sortDirection, config]);

  // Pagination calculation
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedRows, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / itemsPerPage));

  // Reset page when queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, columnFilters, statusFilter]);

  const pendingCount = config.approveField
    ? rows.filter((row) => row[config.approveField!] === false).length
    : 0;
  const approvedCount = config.approveField
    ? rows.filter((row) => row[config.approveField!] === true).length
    : 0;
  const activeCount = config.activeField
    ? rows.filter((row) => row[config.activeField!] === true).length
    : rows.length;

  return (
    <div className="space-y-6">
      {/* Title block with dashboard gradients */}
      <div className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 relative">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">{config.title}</h1>
              <button
                onClick={load}
                disabled={loading}
                title="Sync from Supabase"
                className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${loading ? 'animate-spin text-teal-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{config.description}</p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={filteredAndSortedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <SendNotificationButton section={config.sectionKey} />
          </div>
        </div>

        {/* Dynamic platform metric row */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Entries</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.approveField ? "Pending Approval" : "Active In-app"}
            </p>
            <p className={`mt-1 text-2xl font-black ${config.approveField && pendingCount > 0 ? "text-amber-600 animate-pulse" : "text-emerald-600"}`}>
              {config.approveField ? pendingCount : activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-200">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {config.approveField ? "Approved" : "Showing Filtered"}
            </p>
            <p className="mt-1 text-2xl font-black text-teal-600">
              {config.approveField ? approvedCount : filteredAndSortedRows.length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm animate-bounce">
          <p className="font-extrabold flex items-center gap-1.5">
            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Database Connection Warning
          </p>
          <p className="mt-1.5 leading-relaxed">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 justify-center">
          <span className="h-4 w-4 rounded-full bg-teal-500 glow-active shadow-[0_0_12px_rgba(20,184,166,0.4)]" />
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Syncing data from Supabase...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
          {/* Table Header Filter controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
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
                  placeholder={`Search all columns...`}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all"
                />
              </div>

              {/* Column Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                className={`p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-bold ${
                  showColumnFilters
                    ? "bg-teal-50 border-teal-150 text-teal-600"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showColumnFilters ? "Hide Column Filters" : "Column Filters"}
              </button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap relative">
              {/* Column visibility selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColPicker(!showColPicker)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
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

              {/* Status filtering row tabs */}
              <div className="flex gap-1 border border-slate-150 bg-slate-50 p-1 rounded-xl">
                {(["all", "pending", "approved", "active"] as const).map((filter) => {
                  if ((filter === "pending" || filter === "approved") && !config.approveField) return null;
                  if (filter === "active" && !config.activeField) return null;
                  const active = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                {/* Standard header row with sort triggers */}
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

                {/* Column specific inline filter fields */}
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
                        className="text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600"
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
              
              <tbody>
                {paginatedRows.map((row) => {
                  const id = String(row.id);
                  const editable = editingRows[id] ?? createEditableRow(config, row);
                  return (
                    <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/20 transition-colors">
                      {config.columns.map((c) => {
                        if (!visibleColumns.includes(c.key)) return null;
                        return (
                          <td key={c.key} className="max-w-xs truncate px-5 py-3">
                            {(c.type === "enum" && c.options) || c.optionSource ? (
                              <div className="space-y-1.5">
                                <select
                                  value={String(editable[c.key] ?? "")}
                                  onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500/40 cursor-pointer shadow-sm"
                                >
                                  <option value="" className="text-slate-400">— select —</option>
                                  {optionsFor(c).map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                {c.optionSource === "businesses" && editable[c.key] === "__manual__" && (
                                  <input
                                    type="text"
                                    value={String(editable[`${c.key}_manual_name`] ?? "")}
                                    onChange={(e) => updateRowValue(id, `${c.key}_manual_name`, e.target.value)}
                                    placeholder="Custom Business Name"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40 placeholder-slate-400"
                                  />
                                )}
                              </div>
                            ) : c.type === "boolean" ? (
                              <div className="flex justify-start">
                                <span className={`badge-status ${Boolean(editable[c.key]) ? "badge-approved" : "badge-blocked"}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${Boolean(editable[c.key]) ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  <input
                                    type="checkbox"
                                    checked={Boolean(editable[c.key])}
                                    onChange={(e) => updateRowValue(id, c.key, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer ml-1"
                                  />
                                </span>
                              </div>
                            ) : c.type === "date" ? (
                              <input
                                type="date"
                                value={String(editable[c.key] ?? "")}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40"
                              />
                            ) : c.type === "json" ? (
                              <textarea
                                value={String(editable[c.key] ?? "")}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40 font-mono"
                                rows={1}
                              />
                            ) : c.type === "image" ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Image URL"
                                  value={String(editable[c.key] ?? "")}
                                  onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-850 outline-none focus:border-teal-500/40 placeholder-slate-400"
                                />
                                {editable[c.key] && String(editable[c.key]).startsWith("http") && (
                                  <a
                                    href={String(editable[c.key])}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-teal-600 font-bold hover:underline block"
                                  >
                                    View Image &rarr;
                                  </a>
                                )}
                              </div>
                            ) : c.key === "role" ? (
                              <span className={`badge-status ${
                                editable[c.key] === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                editable[c.key] === "business" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                editable[c.key] === "service_provider" ? "bg-teal-50 text-teal-700 border-teal-200" :
                                "bg-slate-50 text-slate-700 border-slate-200"
                              }`}>
                                <input
                                  type="text"
                                  value={formatValue(editable[c.key])}
                                  onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                  className="w-full bg-transparent border-0 outline-none font-bold text-center text-xs p-0 min-w-16"
                                />
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={formatValue(editable[c.key])}
                                onChange={(e) => updateRowValue(id, c.key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-teal-500/40 placeholder-slate-400"
                              />
                            )}
                          </td>
                        );
                      })}
                      
                      {/* Save/delete controls */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => patch(id, editable)}
                            className="rounded-lg bg-teal-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-teal-700 border border-teal-200 hover:bg-teal-100 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              if (confirm("Permanently delete this entry?")) remove(id);
                            }}
                            className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-100 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                      {/* Operational checkboxes */}
                      {config.approveField && (
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row[config.approveField])}
                            onChange={(e) =>
                              patch(String(row.id), {
                                [config.approveField!]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      {config.featuredField && (
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row[config.featuredField])}
                            onChange={(e) =>
                              patch(String(row.id), {
                                [config.featuredField!]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      {config.activeField && (
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row[config.activeField])}
                            onChange={(e) =>
                              patch(String(row.id), {
                                [config.activeField!]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      {config.availabilityField && (
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(row[config.availabilityField])}
                            onChange={(e) =>
                              patch(String(row.id), {
                                [config.availabilityField!]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAndSortedRows.length === 0 && !error && (
              <p className="p-12 text-center text-xs font-bold text-slate-400">
                No entries found. Adjust your search or add a new record.
              </p>
            )}
          </div>

          {/* Premium Pagination Footer block */}
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-750 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = currentPage === pageNum;
                // Render max 5 page buttons to keep UI extremely clean!
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-750 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
