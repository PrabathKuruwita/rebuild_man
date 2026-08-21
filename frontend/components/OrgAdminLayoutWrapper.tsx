"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import OrgAdminSidebar from "./OrgAdminSidebar";
import SysAdminSidebar from "./SysAdminSidebar";

export default function OrgAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const isOrgAdminPath =
    pathname.startsWith("/org-admin") ||
    pathname === "/organizations" ||
    (pathname.startsWith("/organizations/") && pathname.endsWith("/edit")) ||
    pathname === "/admin/donations" ||
    pathname === "/documents" ||
    pathname === "/needs" ||
    pathname === "/notifications";

  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname === "/organizations" ||
    pathname === "/needs" ||
    pathname === "/documents" ||
    pathname === "/notifications";

  const showSidebar = !loading && user?.role === "ORG_ADMIN" && isOrgAdminPath;
  const showAdminSidebar = !loading && user?.role === "ADMIN" && isAdminPath;
  const hasSidebar = showSidebar || showAdminSidebar;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (hasSidebar) {
        root.style.setProperty("--sidebar-width", isCollapsed ? "5rem" : "16rem");
      } else {
        root.style.setProperty("--sidebar-width", "0px");
      }
    }
  }, [isCollapsed, hasSidebar]);

  const handleToggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(newVal));
    }
  };


  if (showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrgAdminSidebar isCollapsed={isCollapsed} onToggle={handleToggleCollapse} />
        <main className={`pt-16 sm:pt-20 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
          {children}
        </main>
      </div>
    );
  }

  if (showAdminSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SysAdminSidebar isCollapsed={isCollapsed} onToggle={handleToggleCollapse} />
        <main className={`pt-16 sm:pt-20 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
          {children}
        </main>
      </div>
    );
  }

  const isHomePage = pathname === "/";

  return (
    <main className={`min-h-screen ${isHomePage ? "" : "pt-16 sm:pt-20"}`}>
      {children}
    </main>
  );
}
