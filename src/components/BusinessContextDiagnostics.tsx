"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";

export function BusinessContextDiagnostics() {
  const [showDetails, setShowDetails] = useState(false);
  const auth = useAuthStore.getState();

  const hasToken = !!auth.token;
  const hasBusiness = !!auth.business;
  const hasCategory = !!auth.business?.category?.id;
  const isVerified = auth.business?.is_verified === "verified";

  const status = {
    authenticated: hasToken && hasBusiness,
    categorized: hasCategory,
    verified: isVerified || false,
  };

  const allGood = status.authenticated && status.categorized;

  if (allGood) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-4">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          ✅ Business context is properly configured. Filters should load.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-2">Business Context Issues Detected:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {!status.authenticated && (
                <li>
                  ⚠️ Not authenticated or business not loaded
                  {hasBusiness ? ` (Business: ${auth.business?.business_name})` : " (No business in store)"}
                </li>
              )}
              {!status.categorized && (
                <li>
                  ⚠️ Business has no category assigned (required for filters)
                  {hasBusiness && auth.business?.id && ` (Business ID: ${auth.business.id})`}
                </li>
              )}
              {auth.business && !status.verified && (
                <li>ℹ️ Business not verified (may affect some features)</li>
              )}
            </ul>
            <p className="text-xs mt-3 opacity-75">
              Assign a category to your business profile to enable filters management.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="shrink-0"
          >
            {showDetails ? "Hide" : "Details"}
          </Button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <details className="text-xs space-y-2">
              <summary className="font-mono cursor-pointer hover:opacity-70">Raw Data</summary>
              <pre className="bg-black/5 p-2 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(
                  {
                    auth: {
                      token: hasToken ? "present" : "missing",
                      tokenType: auth.tokenType,
                    },
                    business: auth.business
                      ? {
                          id: auth.business.id,
                          name: auth.business.business_name,
                          email: auth.business.email,
                          category: auth.business.category
                            ? {
                                id: auth.business.category.id,
                                name: auth.business.category.name,
                              }
                            : null,
                          verified: auth.business.is_verified,
                        }
                      : null,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Utility hook to programmatically check business context
 */
export function useBusinessContextCheck() {
  const auth = useAuthStore.getState();

  const check = {
    hasAuth: !!auth.token && !!auth.business,
    hasCategory: !!auth.business?.category?.id,
    businessId: auth.business?.id,
    categoryId: auth.business?.category?.id,
    categoryName: auth.business?.category?.name,
  };

  return {
    ...check,
    isReady: check.hasAuth && check.hasCategory,
    missingReason: !check.hasAuth
      ? "Not authenticated"
      : !check.hasCategory
        ? "Business category not assigned"
        : null,
  };
}
