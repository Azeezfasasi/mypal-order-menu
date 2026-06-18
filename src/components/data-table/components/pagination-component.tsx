// components/ui/data-table/pagination-component.tsx
import React from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationComponentProps<T> {
  table: Table<T>;
  config: {
    pageSize?: number;
    enableSelection?: boolean;
  };
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function PaginationComponent<T>({
  table,
  config,
  totalCount,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
}: PaginationComponentProps<T>) {
  // Determine page count based on manual or automatic pagination
  const pageCount = onPageChange
    ? Math.ceil((totalCount || 0) / (config.pageSize || 10))
    : table.getPageCount();

  // For manual pagination, convert backend page (1-based) to TanStack page (0-based)
  const currentPageIndex = onPageChange
    ? currentPage - 1 // Convert from 1-based to 0-based
    : table.getState().pagination.pageIndex;

  return (
    <div className="flex sm:flex-col sm:space-y-4 py-4 items-center  sm:items-start sm:justify-start justify-between space-y-0">
      {/* Selection info */}
      <div className="flex-1 text-sm text-muted-foreground">
        {config.enableSelection && (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex sm:flex-col sm:space-y-4 flex-row items-center sm:items-start  lg:space-x-6 space-y-0 sm:space-x-8">
        {/* Rows per page selector */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium hidden sm:block">Rows per page</p>
          <p className="text-sm font-medium sm:hidden">Rows</p>
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

        {/* Current page display */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {currentPageIndex + 1} of {Math.max(1, pageCount)}
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="lg:hidden h-8 w-8 p-0 flex"
            onClick={() => {
              if (onPageChange) {
                onPageChange(0); // Pass 0-based index to the handler
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
                onPageChange(currentPageIndex - 1); // Pass 0-based index to the handler
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
                onPageChange(currentPageIndex + 1); // Pass 0-based index to the handler
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
            className="lg:hidden h-8 w-8 p-0 flex"
            onClick={() => {
              if (onPageChange) {
                onPageChange(pageCount - 1); // Pass 0-based index to the handler
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
}
