// components/ui/data-table/column-visibility-toggle.tsx
import React from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { formatColumnLabel } from "../table-utils";

interface ColumnVisibilityToggleProps<T> {
  table: Table<T>;
  className?: string;
}

export function ColumnVisibilityToggle<T>({
  table,
  className = "ml-auto",
}: ColumnVisibilityToggleProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Settings2 className="mr-2 h-4 w-4" />
          <span className="md:hidden inline">Columns</span>
          <span className="hidden md:block">Cols</span>
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
                {formatColumnLabel(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
