"use client";

import { AlertCircle } from "lucide-react";

export function UnauthorizedAccess({
  currentCategory,
  requiredCategories,
}: {
  currentCategory?: string;
  requiredCategories: string[];
}) {
  const required = requiredCategories.join(", ");

  return (
    <div className="border rounded-lg p-4 flex gap-3 bg-yellow-50 border-yellow-400">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-600" />
      <div>
        <p className="text-sm font-semibold text-yellow-800">Account Access Issue</p>
        <p className="md:text-xs text-base text-yellow-700 mt-1">
          You&apos;re signed in with the wrong account. Your current account ({currentCategory || "this account"})
          doesn&apos;t have access to this section. Please sign in or switch to an account that has access to{" "}
          {required}.
        </p>
      </div>
    </div>
  );
}