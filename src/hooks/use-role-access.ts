"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  hasPermission,
  normalizeBusinessRole,
  type Permission,
} from "@/lib/role-permissions";
import { useEffect, useState } from "react";

export function useRoleAccess() {
  const businessRole = useAuthStore((state) => state.business?.role);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setMemberRole(window.localStorage.getItem("member-role"));
    setIsReady(true);
  }, []);

  const role = normalizeBusinessRole(memberRole ?? businessRole);

  return {
    role,
    isReady,
    can: (permission: Permission) => hasPermission(role, permission),
  };
}