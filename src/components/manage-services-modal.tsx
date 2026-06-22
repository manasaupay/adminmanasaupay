"use client";

import { useState, useEffect } from "react";

export function ManageServicesModal({
  userId,
  userName,
  isOpen,
  onClose,
}: {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<{ key: string; label: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/admin/options`).then((res) => res.json()),
      fetch(`/api/admin/services?provider_id=${userId}`).then((res) => res.json()),
    ])
      .then(([optsData, servicesData]) => {
        const cats = optsData.allCategories || [];
        setCategories(cats);
        if (Array.isArray(servicesData)) {
          setSelectedCategories(servicesData.map((s) => s.category));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, categories: selectedCategories }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save services");
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Manage Services</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">for {userName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {error && <p className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="h-6 w-6 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.key) || selectedCategories.includes(cat.label)}
                    onChange={(e) => {
                      const val = cat.label || cat.key; // depending on what is stored
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, val]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((c) => c !== val && c !== cat.key));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-bold text-slate-700">{cat.label || cat.key}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Categories"}
          </button>
        </div>
      </div>
    </div>
  );
}
