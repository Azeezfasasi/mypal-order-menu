/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ui/data-table.tsx
"use client";

// types/table.ts
import type {
  SortingFnOption,
  FilterFnOption,
  AccessorFn,
  // ColumnDef as TanStackColumnDef,
} from "@tanstack/react-table";

export interface TableColumn<TData = unknown> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  accessorFn?: AccessorFn<TData, unknown>;
  cell?: (info: {
    getValue: () => unknown;
    row: { original: TData };
  }) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  sortingFn?: SortingFnOption<TData>;
  filterFn?: FilterFnOption<TData>;
  size?: number;
  minSize?: number;
  maxSize?: number;
}

export interface TableAction<TData = unknown> {
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
}

export interface TableConfig<TData = unknown> {
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

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  OnChangeFn,
  // createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Search,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import { TableColumn, TableAction, TableConfig } from "@/types/table";

interface DataTableProps<TData> {
  data: TData[];
  config: TableConfig<TData>;
  isLoading?: boolean;
  error?: string | null;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export default function DataTable<TData>({
  data,
  config,
  isLoading = false,
  error = null,
  totalCount,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  searchValue = "",
  onSearchChange,
  className,
}: DataTableProps<TData>) {
  // Internal states for when external control is not provided
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");

  // Use external or internal state
  const globalFilter = searchValue || internalGlobalFilter;
  const setGlobalFilter = onSearchChange || setInternalGlobalFilter;

  // Handle selection changes with proper updater function support
  const handleSelectionChange = useCallback<OnChangeFn<RowSelectionState>>(
    (updaterOrValue) => {
      const newSelection =
        typeof updaterOrValue === "function"
          ? updaterOrValue(internalRowSelection)
          : updaterOrValue;

      setInternalRowSelection(newSelection);

      if (config.onSelectionChange) {
        const selectedRowData = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)])
          .filter(Boolean);
        config.onSelectionChange(selectedRowData);
      }
    },
    [data, config, internalRowSelection]
  );

  // Create columns with selection column if enabled
  const columns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const cols: ColumnDef<TData, unknown>[] = [];

    // Add selection column if enabled
    if (config.enableSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      });
    }

    // Add configured columns
    config.columns.forEach((column) => {
      // Create the base column definition
      const col: ColumnDef<TData, unknown> = {
        id: column.id,
        header: ({ column: tanstackColumn }) => {
          if (column.enableSorting !== false && config.enableSorting) {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  tanstackColumn.toggleSorting(
                    tanstackColumn.getIsSorted() === "asc"
                  )
                }
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                {column.header}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          }
          return <span className="font-semibold">{column.header}</span>;
        },
        cell:
          column.cell || (({ getValue }) => <span>{String(getValue())}</span>),
        enableSorting: column.enableSorting !== false && config.enableSorting,
        size: column.size,
        minSize: column.minSize,
        maxSize: column.maxSize,
      };

      // Add accessor properties conditionally with proper type assertion
      if (column.accessorKey) {
        (col as any).accessorKey = column.accessorKey as string;
      }
      if (column.accessorFn) {
        (col as any).accessorFn = column.accessorFn;
      }
      if (column.sortingFn) {
        (col as any).sortingFn = column.sortingFn;
      }
      if (column.filterFn) {
        (col as any).filterFn = column.filterFn;
      }

      cols.push(col);
    });

    // Add actions column if actions are configured
    if (config.actions && config.actions.length > 0) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {config.actions
              ?.filter((action) => !action.hidden?.(row.original))
              .map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || "ghost"}
                    size="sm"
                    className={cn("h-8", action.className)}
                    onClick={() => action.onClick(row.original)}
                    disabled={action.disabled?.(row.original)}
                  >
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {action.label}
                  </Button>
                );
              })}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 150,
      });
    }

    return cols;
  }, [config]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: config.enablePagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: config.enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: config.enableFiltering
      ? getFilteredRowModel()
      : undefined,
    onSortingChange: setInternalSorting,
    onColumnFiltersChange: setInternalColumnFilters,
    onColumnVisibilityChange: setInternalColumnVisibility,
    onRowSelectionChange: handleSelectionChange,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting: internalSorting,
      columnFilters: internalColumnFilters,
      columnVisibility: internalColumnVisibility,
      rowSelection: internalRowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: config.pageSize || 10,
      },
    },
    enableRowSelection: config.enableSelection,
    enableMultiRowSelection: config.selectionMode !== "single",
    manualPagination: !!onPageChange,
    pageCount: totalCount
      ? Math.ceil(totalCount / (config.pageSize || 10))
      : undefined,
  });

  // Search component
  const SearchComponent = () => (
    <div className="relative max-w-sm">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="pl-8"
      />
    </div>
  );

  // Column visibility toggle
  const ColumnVisibilityToggle = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Settings2 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Pagination component
  const PaginationComponent = () => {
    const pageCount = onPageChange
      ? Math.ceil((totalCount || 0) / (config.pageSize || 10))
      : table.getPageCount();
    const currentPageIndex = onPageChange
      ? currentPage - 1
      : table.getState().pagination.pageIndex;

    return (
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {config.enableSelection && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={config.pageSize || 10}
              onChange={(e) => {
                const newPageSize = Number(e.target.value);
                if (onPageSizeChange) {
                  onPageSizeChange(newPageSize);
                } else {
                  table.setPageSize(newPageSize);
                }
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-2 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPageIndex + 1} of {Math.max(1, pageCount)}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                if (onPageChange) {
                  onPageChange(1);
                } else {
                  table.setPageIndex(0);
                }
              }}
              disabled={currentPageIndex === 0}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (onPageChange) {
                  onPageChange(currentPage - 1);
                } else {
                  table.previousPage();
                }
              }}
              disabled={currentPageIndex === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (onPageChange) {
                  onPageChange(currentPage + 1);
                } else {
                  table.nextPage();
                }
              }}
              disabled={currentPageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                if (onPageChange) {
                  onPageChange(pageCount);
                } else {
                  table.setPageIndex(pageCount - 1);
                }
              }}
              disabled={currentPageIndex >= pageCount - 1}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {(config.enableFiltering || onSearchChange) && <SearchComponent />}
        </div>
        <div className="flex items-center space-x-2">
          <ColumnVisibilityToggle />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{config.loadingMessage || "Loading..."}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={row.getIsSelected() ? "bg-muted/50" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {config.emptyStateMessage || "No results found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {config.enablePagination && <PaginationComponent />}
    </div>
  );
}
