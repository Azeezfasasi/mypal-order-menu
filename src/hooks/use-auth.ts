// hooks/use-auth.ts
"use client";

import {
  getBusiness,
  isAuthenticated,
  useAuthStore,
} from "@/stores/auth-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuthV1({ required = true } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticatedLocal = useAuthStore(isAuthenticated);
  const user = useAuthStore(getBusiness);
  const { getToken, clearSession } = useAuthStore((state) => state.actions);

  useEffect(() => {
    // Skip auth check if not required (for public pages)
    if (!required) {
      setIsLoading(false);
      return;
    }

    // Verify if user is authenticated
    // Guard the getToken call in case it throws or is not available.
    let token: string | null = null;
    try {
      if (typeof getToken === "function") {
        token = getToken();
      } else {
        // defensive fallback
        console.warn("[useAuthV1] getToken is not a function");
        token = null;
      }
    } catch (err) {
      // Log and treat as unauthenticated
      console.error("[useAuthV1] getToken() threw:", err);
      token = null;
    }

    if (!token || !isAuthenticated()) {
      if (required) {
        // Get the callback URL from the search params or use the current path
        const callbackParam = searchParams.get("callbackUrl");
        const callbackUrl = callbackParam || encodeURIComponent(pathname);

        // Redirect to login with the callback URL
        router.replace(`/signin?callbackUrl=${callbackUrl}`);
      }
    } else {
      setIsLoading(false);
    }
  }, [
    isAuthenticatedLocal,
    router,
    pathname,
    searchParams,
    required,
    getToken,
  ]);

  return {
    user,
    isAuthenticated: isAuthenticated(),
    isLoading,
    logout: clearSession,
  };
}

export interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  roles?: string[];
}

export function useAuth(options: UseAuthOptions = {}) {
  const { required = true, redirectTo = "/login", roles = [] } = options;

  const router = useRouter();
  const pathname = usePathname();
  const isAuth = useAuthStore(isAuthenticated);
  const user = useAuthStore(getBusiness);
  const isLoading = useAuthStore((state) => state.isLoading ?? false);

  // Local loading state to handle transition periods
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[useAuth] Effect running - isLoading: ${isLoading}, isAuth: ${isAuth}, pathname: ${pathname}`,
      );
    }

    // Only run client-side authentication checks after hydration
    if (isLoading) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[useAuth] Still loading, skipping auth check`);
      }
      return;
    }

    // We're not loading anymore
    setLocalLoading(false);

    // Handle authentication requirement
    if (required && !isAuth) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[useAuth] User not authenticated, redirecting from ${pathname} to ${redirectTo}`,
        );
      }
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Handle role-based access if roles are specified
    if (
      required &&
      isAuth &&
      roles.length > 0 &&
      user?.role &&
      !roles.includes(user.role)
    ) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[useAuth] User doesn't have required role, redirecting to unauthorized`,
        );
      }
      router.push("/unauthorized");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[useAuth] Auth check passed for ${pathname}`);
    }
  }, [
    isAuth,
    isLoading,
    pathname,
    redirectTo,
    required,
    roles,
    router,
    user?.role,
  ]);

  return {
    user,
    isAuthenticated: isAuth,
    isLoading: isLoading || localLoading,
    actions: useAuthStore((state) => state.actions),
  };
}
