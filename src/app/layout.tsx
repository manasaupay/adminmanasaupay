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
      <body className="flex min-h-full bg-slate-100 text-slate-900 antialiased">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
            <p className="font-semibold text-slate-950">Manasa Upay Admin</p>
            <p className="text-sm text-slate-500">Use desktop width for full navigation.</p>
          </div>
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
