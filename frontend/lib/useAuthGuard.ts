"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, isLoading, router, pathname]);

  const authorized = !!user;
  return { authorized, isLoading };
}

/**
 * Guard that requires ADMIN or ORG_ADMIN role.
 * Donors are redirected to the dashboard.
 */
export function useAdminGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== "/login") {
      router.push("/login");
      return;
    }
    if (user && user.role === "DONOR") {
      router.push("/");
    }
  }, [user, isLoading, router, pathname]);

  const authorized = !!user && user.role !== "DONOR";
  return { authorized, isLoading };
}
