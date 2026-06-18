"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { EventClass } from "@/types/enums";
import { IEventListItem } from "@/types/event-types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDate } from "../data-table/table-utils";
import { StatusBadge } from "../shared/status-badge";
import DeleteEventDialog from "./delete-event-dialog";
import EditEventModal from "./edit-event-modal/EditEventModal";

interface EventsTableProps {
  events: IEventListItem[];
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onViewDetails: (event: IEventListItem) => void;
  onEventUpdated: () => void;
}

export default function EventsTable({
  events,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onViewDetails,
  onEventUpdated,
}: EventsTableProps) {
  const [editingEvent, setEditingEvent] = useState<IEventListItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<IEventListItem | null>(
    null
  );

  const columns: ColumnDef<IEventListItem>[] = [
    {
      accessorKey: "event_title",
      header: "Event Title",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.original.event_title}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Created",
      cell: ({ row }) => (
        <span className="text-gray-600">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => (
        <span className="text-gray-600">
          {formatDate(row.original.start_date)}
        </span>
      ),
    },
    {
      accessorKey: "event_class",
      header: "Class",
      cell: ({ row }) => (
        <StatusBadge
          variant={
            row.original.event_class === EventClass.EXCLUSIVE
              ? "info"
              : "soft-default"
          }
          badgeType="pill"
        >
          {row.original.event_class === EventClass.EXCLUSIVE
            ? "Exclusive"
            : "Regular"}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "tickets",
      header: "Pricing",
      cell: ({ row }) => (
        <span className="font-light text-orange-600">
          {row.original.tickets.length > 0
            ? `${formatCurrency(row.original.tickets[0].price)} ${
                row.original.tickets.length > 1 ? "(Multiple tickets)" : ""
              }`
            : "Free"}
        </span>
      ),
    },
    {
      accessorKey: "is_verified",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          variant={row.original.is_verified ? "success" : "warning"}
          badgeType="badge"
        >
          {row.original.is_verified ? "Approved" : "Pending"}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-gray-600 hover:text-gray-800 px-2 font-normal bg-transparent"
            onClick={() => onViewDetails(row.original)}
          >
            Details
            <ChevronRight className="h-4 w-4 ml-1 text-primary-550" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingEvent(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeletingEvent(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const rows = table.getRowModel().rows;

  return (
    <>
      <div className="space-y-4 font-manrope">
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-medium text-gray-700"
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
              {events.length ? (
                rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
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
                    No events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            {events.length > 0 && `Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {editingEvent && editingEvent !== null && (
        <EditEventModal
          isOpen={true}
          onClose={() => setEditingEvent(null)}
          event={{
            ...editingEvent,
            eventreservations: editingEvent.eventreservations ?? [],
          }}
          onSuccess={onEventUpdated}
        />
      )}

      {deletingEvent && deletingEvent !== null && (
        <DeleteEventDialog
          isOpen={true}
          onClose={() => setDeletingEvent(null)}
          event={deletingEvent}
          onSuccess={onEventUpdated}
        />
      )}
    </>
  );
}
