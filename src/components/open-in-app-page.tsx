"use client";

import { useEffect } from "react";
import { SHARE_DOMAIN } from "@/lib/constants";

type Props = {
  type: "business" | "service" | "job" | "auto" | "update";
  id: string;
  title: string;
};

/** Tries to open the native app; App Links skip this page when verified. */
export function OpenInAppPage({ type, id, title }: Props) {
  const webPath = `/${type}/${id}`;
  const httpsUrl = `${SHARE_DOMAIN}${webPath}`;
  const customScheme = `manasaupay://${type}/${id}`;

  useEffect(() => {
    window.location.href = customScheme;
    const t = setTimeout(() => {
      // If app not installed, user stays on this fallback page
    }, 1500);
    return () => clearTimeout(t);
  }, [customScheme]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-teal-700">Manasa Upay</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">
        Opening in app… If nothing happens, install Manasa Upay from Play Store.
      </p>
      <a
        href={customScheme}
        className="mt-6 inline-block rounded-lg bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
      >
        Open in App
      </a>
      <p className="mt-4 break-all text-xs text-slate-400">{httpsUrl}</p>
    </div>
  );
}
