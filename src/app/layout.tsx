import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AdminSidebar } from "@/components/admin-sidebar";
import { APP_NAME } from "@/lib/constants";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Admin panel for Manasa Upay hyperlocal platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <AdminAuthGate>
          <div className="flex min-h-screen flex-col lg:flex-row">
            <AdminSidebar />
            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
                <p className="font-bold text-teal-700">Manasa Upay Console</p>
                <p className="mt-1 text-xs text-slate-500">Mobile controls are enabled. Use the quick directory below for navigation.</p>
              </div>
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </AdminAuthGate>
      </body>
    </html>
  );
}
