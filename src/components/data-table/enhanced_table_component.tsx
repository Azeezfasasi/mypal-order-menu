/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ui/data-table.tsx
"use client";

import React, { useState, useMemo, useCallback, JSX } from "react";
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
  Updater,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Import extracted components
import { TableConfig } from "./enhanced_table_types";
import GeneralColumnCell from "./components/general-column-cell";
import { PaginationComponent } from "./components/pagination-component";
import { TableToolbar } from "./components/toolbar-component";
import { formatColumnLabel } from "./table-utils";

/**
 * Props for the DataTable component.
 * @template T - The type of data for the table rows.
 */
interface DataTableProps<T> {
  data: T[];
  config: TableConfig<T>;
  isLoading?: boolean;
  error?: string | null;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

/**
 * A highly customizable and extensible responsive data table component using TanStack Table.
 * Supports features like sorting, filtering, pagination, row selection, and custom cell rendering.
 * @template T - The type of data for the table rows.
 * @param {DataTableProps<T>} props - The props for the DataTable.
 * @returns {JSX.Element} The rendered data table.
 */
export default function DataTable<T>({
  data,
  config,
  isLoading = false,
  error = null,
  totalCount,
  totalPages,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  searchValue = "",
  onSearchChange,
  className,
}: DataTableProps<T>): JSX.Element {
  // Internal states for when external control is not provided
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});
  const [internalGlobalFilter, setInternalGlobalFilter] = useState<string>("");

  // Use external or internal state for global filter (search)
  const globalFilter = searchValue || internalGlobalFilter;
  const setGlobalFilter = onSearchChange || setInternalGlobalFilter;

  // Memoize column definitions to prevent unnecessary re-renders
  const columns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const cols: ColumnDef<T, unknown>[] = [];

    // Add selection column if enabled in config
    if (config.enableSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
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

    // Add configured columns from the config prop
    config.columns.forEach((column) => {
      const baseCol: Partial<ColumnDef<T, unknown>> = {
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
                <span className="whitespace-nowrap">
                  {typeof column.header === "string" ? column.header : null}
                </span>
                <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            );
          }
          return (
            <span className="font-semibold whitespace-nowrap">
              {typeof column.header === "string" ? column.header : null}
            </span>
          );
        },
        cell:
          column.cell ||
          (({ getValue, row }) => {
            const value = getValue();
            return column.type ? (
              <GeneralColumnCell
                column={column}
                value={value}
                row={row as { original: T }}
              />
            ) : (
              <span className="whitespace-nowrap">{String(value)}</span>
            );
          }),
        enableSorting: column.enableSorting !== false && config.enableSorting,
        ...(typeof column.sortingFn === "function"
          ? { sortingFn: column.sortingFn }
          : typeof column.sortingFn === "string" && column.sortingFn.length > 0
          ? { sortingFn: column.sortingFn }
          : {}),
        filterFn:
          typeof column.filterFn === "function" ||
          typeof column.filterFn === "string"
            ? column.filterFn
            : undefined,
        size: column.size,
        minSize: column.minSize,
        maxSize: column.maxSize,
      };

      // Add accessorKey or accessorFn if present
      if (
        "accessorKey" in column &&
        typeof (column as any).accessorKey === "string"
      ) {
        (baseCol as any).accessorKey = (column as any).accessorKey;
      } else if (
        "accessorFn" in column &&
        typeof (column as any).accessorFn === "function"
      ) {
        (baseCol as any).accessorFn = (column as any).accessorFn;
      }
      cols.push(baseCol as ColumnDef<T, unknown>);
    });

    // Add actions column if actions are configured in the table config
    if (config.actions && config.actions.length > 0) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 sm:gap-2">
            {config.actions
              ?.filter((action) => !action.hidden?.(row.original))
              .map((action) => {
                const customAction = action as any;
                if (typeof customAction.renderCustom === "function") {
                  return (
                    <span key={action.id}>
                      {customAction.renderCustom(row.original)}
                    </span>
                  );
                }
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || "ghost"}
                    size="sm"
                    className={cn("h-8 px-2 sm:px-3", action.className)}
                    onClick={() => action.onClick(row.original)}
                    disabled={action.disabled?.(row.original)}
                  >
                    {Icon && <Icon className="h-4 w-4 sm:mr-1" />}
                    <span className="inline sm:hidden">{action.label}</span>
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

  // Handle row selection changes
  const handleSelectionChange = useCallback(
    (updaterOrValue: Updater<RowSelectionState>) => {
      setInternalRowSelection(updaterOrValue);
      if (config.onSelectionChange) {
        const newSelectionState =
          typeof updaterOrValue === "function"
            ? updaterOrValue(internalRowSelection)
            : updaterOrValue;
        const selectedRowData = Object.keys(newSelectionState)
          .filter((key) => newSelectionState[key])
          .map((key) => data[parseInt(key)])
          .filter(Boolean);
        config.onSelectionChange(selectedRowData);
      }
    },
    [data, config, internalRowSelection]
  );

  // Initialize and configure the TanStack Table instance
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
      rowSelection: {},
    },
    enableRowSelection: config.enableSelection,
    enableMultiRowSelection: config.selectionMode !== "single",
    manualPagination: !!onPageChange,
    pageCount:
      typeof totalPages === "number"
        ? totalPages
        : typeof totalCount === "number"
        ? Math.ceil(totalCount / (config.pageSize || 10))
        : undefined,
  });

  // Helper function to get formatted column label
  const getColumnLabel = useCallback((column: any) => {
    // First try to get the configured header
    if (typeof column.columnDef.header === "string") {
      return column.columnDef.header;
    }

    // Then try to format the column ID
    if (column.id && typeof column.id === "string") {
      return formatColumnLabel(column.id);
    }

    // Fallback to the original column.id
    return column.id || "Unknown";
  }, []);

  // Render error message if there is an error
  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <p className="text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar for search and column visibility */}
      <TableToolbar
        table={table}
        config={config}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      {/* Main table display area with responsive wrapper */}
      <div className="rounded-md border overflow-hidden">
        {/* Mobile card view for small screens */}
        <div className="hidden md:block">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{config.loadingMessage || "Loading..."}</span>
              </div>
            </div>
          ) : table.getRowModel().rows?.length ? (
            <div className="divide-y max-h-96 overflow-y-auto">
              {table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "p-4 space-y-2",
                    row.getIsSelected() && "bg-muted/50"
                  )}
                >
                  {/* Selection checkbox for mobile */}
                  {config.enableSelection && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                      />
                      <span className="text-sm font-medium">Select</span>
                    </div>
                  )}

                  {/* Display each visible cell as a key-value pair */}
                  {row
                    .getVisibleCells()
                    .filter(
                      (cell) =>
                        cell.column.id !== "select" &&
                        cell.column.id !== "actions"
                    )
                    .map((cell) => (
                      <div key={cell.id} className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {getColumnLabel(cell.column)}
                        </span>
                        <div className="text-sm break-words">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Actions for mobile */}
                  {config.actions && config.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {config.actions
                        ?.filter((action) => !action.hidden?.(row.original))
                        .map((action) => {
                          const customAction = action as any;
                          if (typeof customAction.renderCustom === "function") {
                            return (
                              <span key={action.id}>
                                {customAction.renderCustom(row.original)}
                              </span>
                            );
                          }
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
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-center text-muted-foreground">
                {config.emptyStateMessage || "No results found."}
              </p>
            </div>
          )}
        </div>

        {/* Desktop table view with horizontal scrolling */}
        <div className="md:hidden block">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="whitespace-nowrap"
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
                {/* Loading state */}
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
                      className={
                        row.getIsSelected() ? "bg-muted/50" : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
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
        </div>
      </div>

      {/* Pagination controls, if enabled */}
      {config.enablePagination && (
        <PaginationComponent
          table={table}
          config={config}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
