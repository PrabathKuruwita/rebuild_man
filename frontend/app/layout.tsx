import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OrgAdminLayoutWrapper from "@/components/OrgAdminLayoutWrapper";
import { AuthProvider } from "@/lib/AuthContext";
import { NotificationProvider } from "@/lib/NotificationContext";

/*
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
*/

export const metadata: Metadata = {
  title: "NeedTracker - Organization Needs Management",
  description: "Track and manage organizational needs with priority-based allocation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        suppressHydrationWarning
        // className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        className={`antialiased bg-gray-50 text-gray-900`}
      >
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            <OrgAdminLayoutWrapper>
              {children}
            </OrgAdminLayoutWrapper>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
