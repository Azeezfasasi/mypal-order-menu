"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { TABLE_SIZE } from "@/lib/constants";

interface CustomPaginationProps<TData> {
  table: Table<TData>;
  totalItems?: number;
}

export function CustomPagination<TData>({
  table,
  totalItems,
}: CustomPaginationProps<TData>) {
  const isMounted = useRef(false);
  const [canNext, setCanNext] = useState(false);
  const [canPrevious, setCanPrevious] = useState(false);

  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Extract pagination state to a separate variable for static analysis
  const paginationState = table.getState().pagination;

  // Update disabled states when pagination changes
  useEffect(() => {
    if (isMounted.current) {
      setCanNext(table.getCanNextPage());
      setCanPrevious(table.getCanPreviousPage());
    }
  }, [table, paginationState]); // Include both table and paginationState

  // Memoize pageSize to avoid unnecessary re-renders
  const pageSize = useMemo(
    () => paginationState.pageSize,
    [paginationState.pageSize]
  );

  const handlePreviousPage = useCallback(() => {
    if (isMounted.current) {
      table.previousPage();
    }
  }, [table]);

  const handleNextPage = useCallback(() => {
    if (isMounted.current) {
      table.nextPage();
    }
  }, [table]);

  const handleSetPageSize = useCallback(
    (value: string) => {
      const newSize = parseInt(value);
      if (isMounted.current && !isNaN(newSize)) {
        table.setPageSize(newSize);
      }
    },
    [table]
  );

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Showing</span>
        <Select value={pageSize.toString()} onValueChange={handleSetPageSize}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent side="top">
            {TABLE_SIZE.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">of {totalItems}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={!canPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!canNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
