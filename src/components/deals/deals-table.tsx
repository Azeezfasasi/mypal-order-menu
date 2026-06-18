"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { IDealListItem } from "@/types/deal-types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";

interface DealsTableProps {
  deals: IDealListItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewDetails: (deal: IDealListItem) => void;
  onEditDeal?: (deal: IDealListItem) => void;
  onDeleteDeal?: (deal: IDealListItem) => void;
  onDealUpdated?: () => void;
}

export default function DealsTable({
  deals,
  currentPage,
  totalPages,
  onPageChange,
  onViewDetails,
  onEditDeal,
  onDeleteDeal,
}: DealsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<IDealListItem>[] = [
    {
      accessorKey: "deal_title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.deal_title}</div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div>{formatCurrency(row.original.price)}</div>,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => (
        <div>{new Date(row.original.start_date).toLocaleDateString()}</div>
      ),
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => (
        <div>{new Date(row.original.end_date).toLocaleDateString()}</div>
      ),
    },
    {
      accessorKey: "is_approved",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.is_approved
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }
        >
          {row.original.is_approved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(row.original)}
            >
              View
            </Button>
            {onEditDeal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditDeal(row.original)}
              >
                Edit
              </Button>
            )}
            {onDeleteDeal && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => onDeleteDeal(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: deals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
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
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No deals found. Create your first deal to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {deals.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
