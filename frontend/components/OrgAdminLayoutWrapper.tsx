"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState, Suspense } from "react";
import { scrollToTopInstant } from "@/lib/scrollUtils";
import OrgAdminSidebar from "./OrgAdminSidebar";
import SysAdminSidebar from "./SysAdminSidebar";

function OrgAdminScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isProfileTab = searchParams.get("profile") === "true";
    // "Manage Needs" is the ONLY tab that targets /organizations without ?profile=true
    const isManageNeeds = pathname === "/organizations" && !isProfileTab;

    if (isManageNeeds) {
      return;
    }

    // Scroll to the very top immediately
    scrollToTopInstant();

    let hasUserScrolled = false;
    const markUserScrolled = () => {
      hasUserScrolled = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space"].includes(e.code)) {
        hasUserScrolled = true;
      }
    };

    window.addEventListener("wheel", markUserScrolled, { passive: true });
    window.addEventListener("touchmove", markUserScrolled, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });

    const safeResetToTop = () => {
      if (!hasUserScrolled) {
        scrollToTopInstant();
      }
    };

    // Staggered timers during initial render to catch micro-delays & state updates
    const timers = [
      setTimeout(safeResetToTop, 50),
      setTimeout(safeResetToTop, 150),
      setTimeout(safeResetToTop, 300),
      setTimeout(safeResetToTop, 600),
      setTimeout(safeResetToTop, 1000),
      setTimeout(safeResetToTop, 1500),
    ];

    // Helper to check if any loading indicator or "Loading data..." is currently in DOM
    const isLoaderActive = () => {
      const mainEl = document.getElementById("org-admin-main") || document.querySelector("main");
      const container = mainEl || document.body;
      return Boolean(
        container.querySelector(".animate-spin") ||
        container.textContent?.includes("Loading data...")
      );
    };

    let wasLoading = isLoaderActive();

    // Observe DOM mutations to detect when async data finishes loading (loader removed)
    const observer = new MutationObserver(() => {
      const currentlyLoading = isLoaderActive();
      if (wasLoading && !currentlyLoading) {
        // Async data loading completed!
        wasLoading = false;
        safeResetToTop();
        requestAnimationFrame(safeResetToTop);
      } else if (currentlyLoading) {
        wasLoading = true;
      } else {
        // Layout change or new cards rendered
        safeResetToTop();
      }
    });

    const targetNode =
      document.getElementById("org-admin-main") ||
      document.querySelector("main") ||
      document.body;

    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }

    // Disconnect observer and listeners after 2.5s window
    const cleanupTimer = setTimeout(() => {
      observer.disconnect();
    }, 2500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(cleanupTimer);
      observer.disconnect();
      window.removeEventListener("wheel", markUserScrolled);
      window.removeEventListener("touchmove", markUserScrolled);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, searchParams]);

  return null;
}

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
        <Suspense fallback={null}>
          <OrgAdminScrollManager />
        </Suspense>
        <OrgAdminSidebar isCollapsed={isCollapsed} onToggle={handleToggleCollapse} />
        <main
          id="org-admin-main"
          className={`pt-16 sm:pt-20 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}
        >
          {children}
        </main>
      </div>
    );
  }

  if (showAdminSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={null}>
          <OrgAdminScrollManager />
        </Suspense>
        <SysAdminSidebar isCollapsed={isCollapsed} onToggle={handleToggleCollapse} />
        <main
          id="org-admin-main"
          className={`pt-16 sm:pt-20 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}
        >
          {children}
        </main>
      </div>
    );
  }

  const isHomePage = pathname === "/";

  return (
    <>
      <Suspense fallback={null}>
        <OrgAdminScrollManager />
      </Suspense>
      <main id="org-admin-main" className={`min-h-screen ${isHomePage ? "" : "pt-16 sm:pt-20"}`}>
        {children}
      </main>
    </>
  );
}
