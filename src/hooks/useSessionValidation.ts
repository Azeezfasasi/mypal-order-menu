"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { validateIntermediateSession } from "@/lib/auth-flow-utils";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook to handle session validation for intermediate auth states
 * Use this in auth pages that can be accessed with intermediate tokens (verify, kyb)
 */
export function useSessionValidation(currentPath: string) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [shouldValidate, setShouldValidate] = useState(false);

  const tokenType = useAuthStore((state) => state.tokenType);
  const business = useAuthStore((state) => state.business);
  const { clearSession } = useAuthStore((state) => state.actions);

  useEffect(() => {
    // Check URL params on client side to avoid SSR issues
    const urlParams = new URLSearchParams(window.location.search);
    const shouldValidateParam = urlParams.get("validate") === "true";
    setShouldValidate(shouldValidateParam);

    if (shouldValidateParam && !isValidating) {
      setIsValidating(true);

      // Validate the current session
      const validation = validateIntermediateSession(
        tokenType,
        business,
        currentPath,
      );

      if (!validation.isValid) {
        // Session is invalid, handle appropriately
        if (validation.shouldClearSession) {
          clearSession();
        }

        // Show message and redirect
        toast.error("Session Issue", {
          description: validation.message,
        });

        // Small delay to show the toast before redirect
        setTimeout(() => {
          router.replace(validation.redirectPath);
        }, 1500);
      } else {
        // Session is valid, show welcome back message
        toast.info("Welcome Back", {
          description: validation.message,
        });

        // Remove the validate parameter from URL for cleaner experience
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("validate");
        router.replace(newUrl.pathname + newUrl.search);
      }

      setIsValidating(false);
    }
  }, [tokenType, business, currentPath, router, clearSession, isValidating]);

  return {
    isValidating,
    shouldValidate,
  };
}
