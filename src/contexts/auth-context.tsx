// components/AuthProvider.tsx
"use client";

import { useAuthStoreHydration } from "@/stores/auth-store";
import type { PropsWithChildren } from "react";

export function AuthProvider({ children }: PropsWithChildren) {
  // This component ensures auth store is hydrated
  useAuthStoreHydration();

  return <>{children}</>;
}
