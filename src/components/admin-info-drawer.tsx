"use client";

import React from "react";

type DrawerSection = {
  title: string;
  desc: string;
  imageRecommendation?: string;
};

type AdminInfoDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  purpose: string;
  sections: DrawerSection[];
  actions?: string[];
};

export function AdminInfoDrawer({
  isOpen,
  onClose,
  title,
  subtitle = "Module Guide & Operations",
  purpose,
  sections,
  actions = [
    "Use filters and search to isolate specific entities dynamically.",
    "Submit custom configurations and settings updates to apply instantly.",
    "Verify, toggle featured priority, or delete records from the actions deck."
  ]
}: AdminInfoDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col justify-between animate-slide-in-right overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h3 className="font-black text-slate-900">{title} Guide</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Guide Content */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-600">
            {/* Section Purpose */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="font-extrabold text-slate-800 text-xs">Section Purpose</p>
              <p className="mt-1 text-slate-500 font-semibold">{purpose}</p>
            </div>

            {/* Subsections & Image Guidelines */}
            <div className="space-y-3">
              <p className="font-extrabold text-slate-850">Layout Sections & Recommended Sizes</p>
              <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 bg-white">
                {sections.map((sec, idx) => (
                  <div key={idx} className="p-3.5 space-y-1">
                    <p className="font-extrabold text-slate-800 text-xs">{sec.title}</p>
                    <p className="text-slate-500 font-semibold">{sec.desc}</p>
                    {sec.imageRecommendation && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-teal-605 font-black uppercase tracking-wider bg-teal-50/50 border border-teal-100/50 px-2 py-1 rounded-lg w-fit">
                        <svg className="h-3 w-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Size: {sec.imageRecommendation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* General Actions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <p className="font-extrabold text-slate-800 text-xs">Admin Actions Explanation</p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-500 font-semibold">
                {actions.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800 cursor-pointer text-center transition-all active:scale-95 shadow-sm"
        >
          Close Guide
        </button>
      </div>
    </div>
  );
}
