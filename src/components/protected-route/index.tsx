// components/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/hooks/use-auth"; // Import the useAuth hook
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "../shared/loading-spinner";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Optional: for role-based protection
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth({
    required: true,
    redirectTo: "/login",
    roles: requiredRole ? [requiredRole] : undefined, // Pass roles if requiredRole is provided
  });
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before doing any auth checks
  useEffect(() => {
    setMounted(true);
  }, []);

  // This part should ideally not be reached if useAuth is correctly configured
  // However, for extra safety, you can handle the unauthenticated case here as well
  useEffect(() => {
    if (mounted && !isAuthenticated && !isLoading) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[ProtectedRoute] Redirecting unauthenticated user from ${pathname}`,
        );
      }
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname, mounted]);

  // Don't render anything until mounted (prevents SSR/hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  // User is authenticated (and has required role if specified)
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null; // Or a fallback UI if needed
}

//EXAMPLE

{
  /* <ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute> */
}
