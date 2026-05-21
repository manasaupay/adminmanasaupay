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
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </body>
    </html>
  );
}
