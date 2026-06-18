import React, { type ReactNode, useState } from "react";
import {
  type ColumnDef,
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
  Table as ReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DataTablePropsV2<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  mode?: "client" | "server";
  pagination?: {
    initialState?: {
      pageIndex: number;
      pageSize: number;
    };
    onPaginationChange?: (pagination: {
      pageIndex: number;
      pageSize: number;
    }) => void;
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
  customPagination?: React.FC<{ table: ReactTable<TData> }>; // Fixed type for table
}

export function DataTableV2<TData, TValue>({
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
  customPagination,
}: DataTablePropsV2<TData, TValue>) {
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

  // TData extends object,

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
    onSortingChange: (updatedSorting) => {
      setSortingState(updatedSorting as SortingState);
      if (sorting?.onSortingChange) {
        sorting.onSortingChange(updatedSorting as SortingState);
      }
    },
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
    manualPagination: mode === "server",
    manualSorting: mode === "server",
    manualFiltering: mode === "server",
  });

  return (
    <div className="space-y-4">
      {(!hideSearch || !hideColumnVisibility) && (
        <div className="flex items-center justify-between">
          {!hideSearch && (
            <div className="flex flex-1 items-center space-x-2">
              <Input
                placeholder="Filter records..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-8 w-64"
              />
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
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={className}>
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
        </Table>
      </div>

      {/* Render custom  if provided, otherwise use default pagination */}
      {customPagination ? (
        (customPagination({ table }) as ReactNode)
      ) : (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
