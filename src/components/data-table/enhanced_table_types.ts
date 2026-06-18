// types/enhanced-table-types.ts
import type { ColumnDef, TableOptions } from "@tanstack/react-table";
import type React from "react";
import type { ExtendedBadgeVariant, BadgeType } from "../shared/status-badge";

export type TableColumn<TData> = ColumnDef<TData, unknown> & {
  type?:
    | "text"
    | "number"
    | "date"
    | "datetime"
    | "currency"
    | "percentage"
    | "status"
    | "avatar"
    | "image"
    | "link"
    | "email"
    | "phone"
    | "boolean"
    | "tags"
    | "progress"
    | "rating";
  format?: string;
  currency?: string;
  statusConfig?: StatusConfig;
  linkConfig?: LinkConfig;
  imageConfig?: ImageConfig;
  tagsConfig?: TagsConfig;
  progressConfig?: ProgressConfig;
  ratingConfig?: RatingConfig;
};

export interface StatusConfig {
  colorMap?: Record<string, ExtendedBadgeVariant>;
  badgeType?: BadgeType; // "badge" | "dot" | "pill" | "dot-only"
  showDot?: boolean;
  dotPosition?: "left" | "right";
  showIcon?: boolean;
  iconMap?: Record<string, React.ComponentType<{ className?: string }>>;
  className?: string;
}

export interface LinkConfig {
  external?: boolean;
  target?: "_blank" | "_self";
  className?: string;
}

export interface ImageConfig {
  fallback?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square" | "rounded";
  showName?: boolean;
}

export interface TagsConfig {
  maxDisplay?: number;
  badgeType?: BadgeType;
  variant?: ExtendedBadgeVariant;
  colorMap?: Record<string, string>;
}

export interface ProgressConfig {
  showPercentage?: boolean;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export interface RatingConfig {
  max?: number;
  icon?: React.ComponentType<{ className?: string }>;
  showValue?: boolean;
}

export interface TableAction<TData> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  disabled?: (row: TData) => boolean;
  hidden?: (row: TData) => boolean;
  // Optionally allow renderCustom for custom action rendering
  renderCustom?: (row: TData) => React.ReactNode;
}

export interface TableConfig<TData> extends Partial<TableOptions<TData>> {
  columns: TableColumn<TData>[];
  actions?: TableAction<TData>[];
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  selectionMode?: "single" | "multiple";
  onSelectionChange?: (selectedRows: TData[]) => void;
  emptyStateMessage?: string;
  loadingMessage?: string;
  className?: string;
}
