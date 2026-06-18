"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createAvatarUrl } from "@/lib/avatar-utils";
import { BusinessOverviewAndRevenueApi } from "@/services/api/business-overview-and-revenue-api";
import { ReservationStatus } from "@/types/enums";
import type { Reservation } from "@/types/overview"; // Assuming Reservation is the correct type now
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import DataTable from "../data-table/enhanced_table_component";
import {
  StatusConfig,
  TableAction,
  TableColumn,
  TableConfig,
} from "../data-table/enhanced_table_types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ReservationDetailsModal } from "./reservation-details-modal";

interface ReservationsTableProps {
  reservations: Reservation[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  totalPages?: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function ReservationsTable({
  reservations,
  isLoading,
  error,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSize = 10,
  searchValue,
  onSearchChange,
}: ReservationsTableProps) {
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateStatus =
    BusinessOverviewAndRevenueApi.useUpdateReservationStatus();

  // Define column configurations for DataTable
  const columns: TableColumn<Reservation>[] = useMemo(
    () => [
      {
        id: "customerName",
        header: "Name",
        accessorFn: (row) => `${row.user?.firstname} ${row.user?.lastname}`,
        cell: ({ row }) => {
          const fullName = `${row.original.user?.firstname} ${row.original.user?.lastname}`;

          return (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="flex-shrink-0 h-8 w-8">
                <AvatarImage
                  src={
                    row.original.user?.image_url ||
                    createAvatarUrl({ avatarUrl: fullName })
                  }
                  // src={createAvatarUrl(row.original.avatar)  ?? undefined}
                  alt={fullName}
                />
                <AvatarFallback className="text-xs">{fullName}</AvatarFallback>
              </Avatar>
              <span className="font-medium truncate">{fullName}</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "ticketId",
        header: "Ticket ID",
        accessorKey: "id", // Assuming 'id' is the ticket ID
        enableSorting: true,
      },
      {
        id: "reservationDate",
        type: "text",
        header: "Date",
        accessorFn: (row) => row.details.date, // Accessing nested date
        enableSorting: true,
      },
      {
        id: "status",
        header: "Reservation Status",
        accessorKey: "status",
        type: "status",
        statusConfig: {
          variant: "badge",
          colorMap: {
            Booked: "solid-success", // Map your status strings to DataTable's badge variants
            Pending: "default",
            Cancelled: "destructive",
            // Add other statuses as needed
          },
        } as StatusConfig,
        enableSorting: true,
      },
    ],
    []
  );

  // Define actions for DataTable
  const actions = useMemo(
    (): TableAction<Reservation>[] => [
      {
        id: "statusActions",
        label: "More",
        icon: MoreHorizontal,
        onClick: () => {}, // Not used, handled in custom cell
        renderCustom: (reservation: Reservation) => (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedReservation(reservation);
                    setIsModalOpen(true);
                  }}
                >
                  View details
                </DropdownMenuItem>
                {reservation.status === ReservationStatus.PENDING && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        updateStatus.mutate({
                          id: reservation.id,
                          status: { accept: true, decline: false },
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      Accept
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateStatus.mutate({
                          id: reservation.id,
                          status: { accept: false, decline: true },
                        })
                      }
                      disabled={updateStatus.isPending}
                    >
                      Decline
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Show modal only for this row */}
          </>
        ),
      },
    ],
    [updateStatus]
  );

  // Define the table configuration
  const tableConfig: TableConfig<Reservation> = useMemo(
    () => ({
      columns,
      actions,
      enableSelection: true,
      enableSorting: true,
      enableFiltering: true, // Enable filtering (search)
      enablePagination: true,
      pageSize, // Or dynamically set based on ITEMS_PER_PAGE from DashboardPage
      selectionMode: "multiple",
      emptyStateMessage: "No reservations found.",
      loadingMessage: "Fetching reservations...",
      onSelectionChange: (selectedRows) => {
        // Handle selected rows if needed
        console.log("Selected Rows:", selectedRows);
      },
    }),
    [columns, actions, pageSize]
  );

  return (
    <div>
      <DataTable
        data={reservations}
        config={tableConfig}
        isLoading={isLoading}
        error={error}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        totalPages={totalPages}
      />

      {selectedReservation?.details?.id && (
        <ReservationDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
        />
      )}
    </div>
  );
}
