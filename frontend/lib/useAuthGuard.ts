"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export function useAuthGuard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized = !isLoading && (!!user || pathname === "/login");

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [user, isLoading, router, pathname]);

  return { authorized, isLoading };
}

/**
 * Guard that requires ADMIN or ORG_ADMIN role.
 * Donors are redirected to the dashboard.
 */
export function useAdminGuard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized =
    !isLoading &&
    ((user && user.role !== "DONOR") || (!user && pathname === "/login"));

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && user.role === "DONOR") {
        router.push("/");
      }
    }
  }, [user, isLoading, router, pathname]);

  return { authorized: !!authorized, isLoading };
}
