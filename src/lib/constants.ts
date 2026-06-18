import {
  Home,
  ShoppingCart,
  UserPlus,
  Package,
  Tag,
  MessageSquare,
  Users,
  Book,
  Settings,
  LogOut,
  ShoppingBag,
} from "lucide-react";

export const STATUSCODE = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
} as const;

export const TABLE_SIZE = [10, 20, 30, 40, 50];

export const sidebarNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Order", href: "/orders", icon: ShoppingCart },
  { name: "Agents", href: "/agents", icon: UserPlus },
  { name: "Categories", href: "/categories", icon: ShoppingBag },
  { name: "Produces", href: "/produces", icon: Package },
  { name: "Price Ads", href: "/price-ads", icon: Tag },
  { name: "Request", href: "/request", icon: MessageSquare },
  { name: "Users", href: "/users", icon: Users },
  { name: "Aladdin Request", href: "/aladdin-request", icon: Book },
];

export const sidebarBottomNavigation = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Logout",
    href: "",
    icon: LogOut,
    // onClick: () => getAuthActions().logout(),
  },
];

export const filterTimeOptions = [
  { value: "all", label: "All" },
  { value: "yesterday", label: "Yesterday" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "today", label: "Today" },
  { value: "lastWeek", label: "Last Week" },
  { value: "lastMonth", label: "Last Month" },
  { value: "lastTwoMonths", label: "Last 2 Months" },
  { value: "lastSixMonths", label: "Last 6 Months" },
  { value: "lastYear", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
];

export const priceFilterOptions = [
  { value: "all", label: "All" },
  { value: "gain", label: "Gain" },
  { value: "loss", label: "Losses" },
];
