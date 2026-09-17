export const BUSINESS_ROLES = {
  SUPER_ADMIN: "Super admin",
  MEDIA_MANAGER: "Media manager",
  MENU_MANAGER: "Menu manager",
  CONTENT_MANAGER: "Content manager",
  FINANCE_MANAGER: "Finance manager",
  SERVICE_DESK: "Service Desk",
  EVENT_MANAGER: "Event manager",
  RESERVATION_MANAGER: "Reservation Manager",
  ORDER_KITCHEN_MANAGER: "Order/Kitchen manager",
  OPERATIONAL_MANAGER: "Operational Manager",
} as const;

export type BusinessRole = (typeof BUSINESS_ROLES)[keyof typeof BUSINESS_ROLES];

export type Permission = "menu-item-edit";

export const ROLE_PERMISSIONS: Record<BusinessRole, readonly Permission[]> = {
  [BUSINESS_ROLES.SUPER_ADMIN]: ["menu-item-edit"],
  [BUSINESS_ROLES.MEDIA_MANAGER]: [],
  [BUSINESS_ROLES.MENU_MANAGER]: [],
  [BUSINESS_ROLES.CONTENT_MANAGER]: [],
  [BUSINESS_ROLES.FINANCE_MANAGER]: [],
  [BUSINESS_ROLES.SERVICE_DESK]: [],
  [BUSINESS_ROLES.EVENT_MANAGER]: [],
  [BUSINESS_ROLES.RESERVATION_MANAGER]: [],
  [BUSINESS_ROLES.ORDER_KITCHEN_MANAGER]: [],
  [BUSINESS_ROLES.OPERATIONAL_MANAGER]: ["menu-item-edit"],
};

const ROLE_ALIASES: Record<string, BusinessRole> = {
  superadmin: BUSINESS_ROLES.SUPER_ADMIN,
  "super admin": BUSINESS_ROLES.SUPER_ADMIN,
  business: BUSINESS_ROLES.SUPER_ADMIN,
  admin: BUSINESS_ROLES.SUPER_ADMIN,
  "media manager": BUSINESS_ROLES.MEDIA_MANAGER,
  "menu manager": BUSINESS_ROLES.MENU_MANAGER,
  "content manager": BUSINESS_ROLES.CONTENT_MANAGER,
  "finance manager": BUSINESS_ROLES.FINANCE_MANAGER,
  "service desk": BUSINESS_ROLES.SERVICE_DESK,
  "event manager": BUSINESS_ROLES.EVENT_MANAGER,
  "reservation manager": BUSINESS_ROLES.RESERVATION_MANAGER,
  "order/kitchen manager": BUSINESS_ROLES.ORDER_KITCHEN_MANAGER,
  "order kitchen manager": BUSINESS_ROLES.ORDER_KITCHEN_MANAGER,
  order_kitchen_manager: BUSINESS_ROLES.ORDER_KITCHEN_MANAGER,
  "operational manager": BUSINESS_ROLES.OPERATIONAL_MANAGER,
  "operations manager": BUSINESS_ROLES.OPERATIONAL_MANAGER,
};

export function normalizeBusinessRole(role?: string | null): BusinessRole | null {
  if (!role) return null;
  return ROLE_ALIASES[role.trim().toLowerCase()] ?? null;
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission,
): boolean {
  const normalizedRole = normalizeBusinessRole(role);
  return normalizedRole
    ? ROLE_PERMISSIONS[normalizedRole].includes(permission)
    : false;
}