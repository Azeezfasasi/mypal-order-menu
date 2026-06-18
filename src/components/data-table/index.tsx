// Modified DataTable.tsx with proper typing and sorting implementation
import React, { useState, useEffect } from "react";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableFacetedFilter } from "./faceted-filter";
import { TableProps } from "./types";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export function DataTable<TData>({
  data,
  columns,
  mode = "client",
  pagination,
  sorting,
  filtering,
  columnVisibility,
  className = "",
  hideSearch = false,
  hideColumnVisibility = false,
  loading = false,
  totalItems,
  customTopFilter,
  customPagination,
}: TableProps<TData>) {
  // States for client-side operations
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    filtering?.initialState || [],
  );
  const [sortingState, setSortingState] = useState<SortingState>(
    sorting?.initialState || [],
  );
  const [columnVisibilityState, setColumnVisibilityState] =
    useState<VisibilityState>(columnVisibility?.initialState || {});
  const [paginationState, setPaginationState] = useState({
    pageIndex: pagination?.initialState?.pageIndex || 0,
    pageSize: pagination?.initialState?.pageSize || 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");

  // Sync states for server-side mode
  useEffect(() => {
    if (mode === "server") {
      filtering?.onFilteringChange?.(columnFilters);
    }
  }, [columnFilters, mode, filtering]);

  useEffect(() => {
    if (mode === "server") {
      sorting?.onSortingChange?.(sortingState);
    }
  }, [sortingState, mode, sorting]);

  useEffect(() => {
    if (mode === "server") {
      pagination?.onPaginationChange?.(paginationState);
    }
  }, [paginationState, mode, pagination]);

  useEffect(() => {
    if (mode === "server") {
      columnVisibility?.onVisibilityChange?.(columnVisibilityState);
    }
  }, [columnVisibilityState, mode, columnVisibility]);

  // Create the table instance
  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      columnFilters,
      sorting: sortingState,
      columnVisibility: columnVisibilityState,
      pagination: paginationState,
      globalFilter,
    },
    enableRowSelection: true,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSortingState,
    onColumnVisibilityChange: setColumnVisibilityState,
    onPaginationChange: setPaginationState,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    // Only apply these models in client-side mode
    ...(mode === "client"
      ? {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }
      : {}),
    // For server-side pagination
    ...(mode === "server" && pagination?.pageCount
      ? { pageCount: pagination.pageCount }
      : {}),
    manualPagination: mode === "server",
    manualSorting: mode === "server",
    manualFiltering: mode === "server",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-4 md:flex-col md:items-start">
        {/* Custom top filter component */}
        {customTopFilter ? (
          <div className="w-auto sm:w-full">{customTopFilter}</div>
        ) : (
          <div className="flex flex-1 items-center space-x-2">
            {!hideSearch && (
              <Input
                placeholder="Filter records..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-8 w-64"
              />
            )}
            {filtering?.facets && (
              <div className="flex space-x-2">
                {filtering.facets.map((facet) => {
                  const column = table.getColumn(facet.columnId);
                  return column ? (
                    <DataTableFacetedFilter
                      key={facet.columnId}
                      column={column}
                      title={facet.title}
                      options={facet.options}
                    />
                  ) : null; // Explicit check if column is undefined and return null
                })}
              </div>
            )}
          </div>
        )}
        {!hideColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
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
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                      }
                      onClick={
                        header.column.getCanSort()
                          ? () =>
                              header.column.toggleSorting(
                                header.column.getIsSorted() === "asc",
                              )
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                          {header.column.getCanSort() && (
                            <div className="flex-none">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={cn("text-gray-500", className)}>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UITable>
      </div>
      {/* Use custom pagination if provided, otherwise use default */}
      {customPagination ? (
        customPagination({
          table,
          totalItems:
            totalItems ||
            (mode === "client"
              ? table.getFilteredRowModel().rows.length
              : undefined),
        })
      ) : (
        <DataTablePagination
          table={table}
          totalItems={
            totalItems ||
            (mode === "client"
              ? table.getFilteredRowModel().rows.length
              : undefined)
          }
        />
      )}
    </div>
  );
}
