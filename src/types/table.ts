// types/table.ts
import type {
  ColumnDef,
  TableOptions,
  SortingFn,
  FilterFn,
} from "@tanstack/react-table";
import type React from "react";

// TableColumn now extends ColumnDef from @tanstack/react-table
export type TableColumn<TData> = ColumnDef<TData, unknown> & {
  // Custom properties specific to your DataTable component
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
  format?: string; // For date/number formatting
  currency?: string; // For currency type (USD, EUR, etc.)
  statusConfig?: StatusConfig; // For status type
  linkConfig?: LinkConfig; // For link type
  imageConfig?: ImageConfig; // For image/avatar type
  tagsConfig?: TagsConfig; // For tags type
  progressConfig?: ProgressConfig; // For progress type
  ratingConfig?: RatingConfig; // For rating type
  sortingFn?: SortingFn<TData> | string;
  filterFn?: FilterFn<TData> | string;
};

export interface StatusConfig {
  colorMap: Record<string, "default" | "secondary" | "destructive" | "outline">;
  variant?: "badge" | "dot" | "pill";
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
  showName?: boolean; // For avatar with name
}

export interface TagsConfig {
  maxDisplay?: number;
  variant?: "default" | "secondary" | "destructive" | "outline";
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
