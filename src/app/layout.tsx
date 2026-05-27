import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
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
      <body className="flex min-h-full bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-md lg:hidden">
            <p className="font-bold text-teal-700">Manasa Upay Console</p>
            <p className="text-xs text-slate-500 mt-1">Please use a wider screen or desktop view for the full operations suite.</p>
          </div>
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
