"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        setAuthorized(false);
        router.push("/login");
      } else {
        setAuthorized(true);
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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        setAuthorized(false);
        router.push("/login");
      } else if (user && user.role === "DONOR") {
        setAuthorized(false);
        router.push("/");
      } else if (user) {
        setAuthorized(true);
      }
    }
  }, [user, isLoading, router, pathname]);

  return { authorized, isLoading };
}
