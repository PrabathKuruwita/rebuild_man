import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OrgAdminLayoutWrapper from "@/components/OrgAdminLayoutWrapper";
import { AuthProvider } from "@/lib/AuthContext";
import { NotificationProvider } from "@/lib/NotificationContext";

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Parithyaga Donations",
  description: "Track and manage organizational needs with priority-based allocation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${sora.variable} ${plusJakartaSans.variable}`}>
      <body
        suppressHydrationWarning
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
