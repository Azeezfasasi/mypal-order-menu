// types.ts
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  Table as TableInstance,
} from "@tanstack/react-table";
import { ReactNode } from "react";

export type TableMode = "client" | "server";

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  mode?: TableMode;
  pagination?: {
    pageCount?: number;
    initialState?: PaginationState;
    onPaginationChange?: (pagination: PaginationState) => void;
  };
  sorting?: {
    initialState?: SortingState;
    onSortingChange?: (sorting: SortingState) => void;
  };
  filtering?: {
    initialState?: ColumnFiltersState;
    onFilteringChange?: (filtering: ColumnFiltersState) => void;
    facets?: {
      columnId: string;
      title: string;
      options: { label: string; value: string }[];
    }[];
  };
  columnVisibility?: {
    initialState?: VisibilityState;
    onVisibilityChange?: (visibility: VisibilityState) => void;
  };
  className?: string;
  hideSearch?: boolean;
  hideColumnVisibility?: boolean;
  loading?: boolean;
  totalItems?: number;
  // Add new props for custom components
  customTopFilter?: ReactNode;
  customPagination?: (props: {
    table: TableInstance<TData>;
    totalItems?: number;
  }) => ReactNode;
}
