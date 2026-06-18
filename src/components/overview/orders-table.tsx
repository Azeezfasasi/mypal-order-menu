"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusinessOverviewAndRevenueApi } from "@/services/api/business-overview-and-revenue-api";
import { OrderStatus } from "@/types/enums";
import type { Order } from "@/types/overview";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import DataTable from "../data-table/enhanced_table_component";
import {
  StatusConfig,
  TableAction,
  TableColumn,
  TableConfig,
} from "../data-table/enhanced_table_types";
import { OrderDetailsModal } from "./order-details-modal";

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function OrdersTable({
  orders,
  isLoading,
  error,
  totalCount,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSize = 10,
  searchValue,
  onSearchChange,
}: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMenuOrder, setStatusMenuOrder] = useState<Order | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const updateOrderStatus =
    BusinessOverviewAndRevenueApi.useUpdateOrderStatus();

  // Table columns
  const columns: TableColumn<Order>[] = useMemo(
    () => [
      {
        id: "customerName",
        header: "Name",
        accessorFn: (row) => `${row.user.firstname} ${row.user.lastname}`,
        enableSorting: true,
      },
      {
        id: "orderId",
        header: "Order ID",
        accessorKey: "id",
        enableSorting: true,
      },
      {
        id: "date",
        header: "Date",
        accessorFn: (row) => new Date(row.createdAt).toLocaleDateString(),
        enableSorting: true,
      },
      {
        id: "amount",
        header: "Amount",
        accessorFn: (row) => row.details.amount,
        type: "currency",
        enableSorting: true,
      },
      {
        id: "status",
        header: "Order Status",
        accessorFn: (row) =>
          row.status
            ? row.status
            : row.details.status
            ? row.details.status
            : row.details.payment.status,
        type: "status",
        statusConfig: {
          colorMap: {
            pending: "default",
            processing: "outline",
            preparing: "outline",
            ready: "success",
            "on-transit": "outline",
            completed: "success",
            cancelled: "destructive",
          },
        } as StatusConfig,
        enableSorting: true,
      },
    ],
    []
  );

  // Table actions (view details, future: update status, etc.)
  const actions: TableAction<Order>[] = useMemo(
    () => [
      {
        id: "orderActions",
        label: "More",
        icon: MoreHorizontal,
        onClick: () => {},
        renderCustom: (order: Order) => (
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
                    setSelectedOrder(order);
                    setIsModalOpen(true);
                  }}
                >
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={order.status === OrderStatus.CANCELLED}
                  onClick={() => {
                    if (order.status !== OrderStatus.CANCELLED) {
                      setStatusMenuOrder(order);
                      setStatusMenuOpen(true);
                    }
                  }}
                >
                  Change status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedOrder?.id === order.id && (
              <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
              />
            )}
            {/* Status change menu/modal */}
            {statusMenuOpen && statusMenuOrder?.id === order.id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[340px] max-w-xs w-full flex flex-col items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    Change Order Status
                  </h3>
                  <div className="w-full flex items-center justify-center my-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-500 mr-2">
                      Current:
                    </span>
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${
                    order.status === "completed" || order.status === "ready"
                      ? "bg-green-100 text-green-800"
                      : order.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }
                `}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                  <div className="w-full flex flex-col gap-3">
                    {/* Only show status change options if order is not cancelled */}
                    {order.status !== OrderStatus.CANCELLED ? (
                      // Only allow changes between cancelled, ready and cancelled
                      [
                        OrderStatus.CANCELLED,
                        OrderStatus.READY,
                        OrderStatus.CANCELLED,
                      ].map((status) => {
                        const displayStatus = status
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ");

                        return (
                          <Button
                            key={status}
                            disabled={
                              updateOrderStatus.isPending ||
                              order.status === status
                            }
                            className={`w-full py-3 px-4 rounded-lg border text-base font-medium transition-colors
                              ${
                                order.status === status
                                  ? "bg-primary text-white border-primary cursor-not-allowed"
                                  : "bg-gray-50 hover:bg-primary/10 focus:bg-primary/20 border-gray-200 text-gray-800"
                              }
                              ${
                                updateOrderStatus.isPending
                                  ? "opacity-60 cursor-wait"
                                  : ""
                              }
                            `}
                            onClick={() => {
                              updateOrderStatus.mutate(
                                { id: order.id, status },
                                {
                                  onSuccess: () => {
                                    setStatusMenuOpen(false);
                                    setStatusMenuOrder(null);
                                  },
                                }
                              );
                            }}
                          >
                            {updateOrderStatus.isPending &&
                            status === updateOrderStatus.variables?.status ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4 text-current"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Updating...
                              </span>
                            ) : (
                              displayStatus
                            )}
                          </Button>
                        );
                      })
                    ) : (
                      // Show message for cancelled orders
                      <div className="w-full py-4 px-4 rounded-lg bg-red-50 border border-red-200 text-center">
                        <p className="text-red-800 font-medium">
                          Cancelled orders cannot be changed
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    className="mt-6 w-full py-2 px-4 rounded-lg border border-gray-200 bg-red-400 text-white hover:bg-gray-700 focus:bg-gray-200 font-medium transition-colors"
                    onClick={() => {
                      setStatusMenuOpen(false);
                      setStatusMenuOrder(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ),
      },
    ],
    [
      selectedOrder,
      isModalOpen,
      statusMenuOrder,
      statusMenuOpen,
      updateOrderStatus,
    ]
  );

  // Table config
  const tableConfig: TableConfig<Order> = useMemo(
    () => ({
      columns,
      actions,
      enableSelection: true,
      enableSorting: true,
      enableFiltering: true,
      enablePagination: true,
      pageSize, // Use dynamic page size
      selectionMode: "multiple",
      emptyStateMessage: "No orders found.",
      loadingMessage: "Fetching orders...",
      onSelectionChange: (selectedRows) => {
        // Handle selected rows if needed
        console.log("Selected Orders:", selectedRows);
      },
    }),
    [columns, actions, pageSize]
  );

  return (
    <div>
      <DataTable
        data={orders}
        config={tableConfig}
        isLoading={isLoading}
        error={error}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
