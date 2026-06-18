// components/ui/data-table/table-toolbar.tsx
import React from "react";
import { Table } from "@tanstack/react-table";
import { SearchComponent } from "./search-component";
import { ColumnVisibilityToggle } from "./column-visibility-toggle";

interface TableToolbarProps<T> {
  table: Table<T>;
  config: {
    enableFiltering?: boolean;
  };
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  className?: string;
}

export function TableToolbar<T>({
  table,
  config,
  searchValue,
  onSearchChange,
  globalFilter,
  setGlobalFilter,
  className = "flex sm:flex-col sm:space-y-4 items-center sm:items-start justify-between sm:justify-start space-y-0",
}: TableToolbarProps<T>) {
  const shouldShowSearch = config.enableFiltering || onSearchChange;
  const currentSearchValue = searchValue || globalFilter || "";
  const currentSetSearch = onSearchChange || setGlobalFilter;

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        {shouldShowSearch && currentSetSearch && (
          <SearchComponent
            value={currentSearchValue}
            onChange={currentSetSearch}
            className="relative w-full max-w-sm"
          />
        )}
      </div>
      <div className="flex items-center space-x-2">
        <ColumnVisibilityToggle table={table} />
      </div>
    </div>
  );
}
