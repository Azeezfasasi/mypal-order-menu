"use client";

import { useState, useMemo } from "react";
// import { MoreHorizontal } from "lucide-react";

import { TransactionDetailsModal } from "./transaction-details-modal";
import type { BusinessTransaction, TransactionRow } from "@/types/overview";
import DataTable from "../data-table/enhanced_table_component";
import { formatCurrency } from "@/lib/utils";
import {
  StatusConfig,
  TableAction,
  TableColumn,
  TableConfig,
} from "../data-table/enhanced_table_types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { createAvatarUrl } from "@/lib/avatar-utils";

function mapBusinessTransactionToRow(tx: BusinessTransaction): TransactionRow {
  // Generate a transaction ID based on the transaction type and ID
  // const transactionId = tx.type === "Ticket" ? `TKT-${tx.id}` : `ACC-${tx.id}`;

  // Generate status - since BusinessTransaction doesn't have status field,
  // we'll assume completed for now or you can add status logic
  const status = tx.status; // You might want to derive this from payment status or add it to the BusinessTransaction type

  // Generate payment method - placeholder since it's not in BusinessTransaction
  const paymentMethod = "Card"; // You might want to add this to the BusinessTransaction type

  // Generate reference - placeholder since it's not in BusinessTransaction
  const reference = `REF-${tx.id.slice(-6).toUpperCase()}`;

  return {
    id: tx.id,
    name: `${tx.user?.firstname || ""} ${tx.user?.lastname || ""}`.trim(),
    avatar: tx.user?.image_url || "/placeholder.svg",
    ticketId: tx.id,
    ticketType: tx.type,
    date: tx.createdAt,
    amount: formatCurrency(tx.amount as number) || "0",
    status,
    transactionType: tx.type,
    paymentMethod,
    reference,
    details: tx.details, // Pass details for modal
  };
}

interface TransactionsTableProps {
  transactions: BusinessTransaction[];
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

export default function TransactionsTable({
  transactions,
  isLoading,
  error,
  totalCount,
  currentPage,
  onPageChange,
  onPageSizeChange,
  totalPages,
  pageSize = 10,
  searchValue,
  onSearchChange,
}: TransactionsTableProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Map API transactions to UI rows
  const rows = useMemo(
    () => transactions.map(mapBusinessTransactionToRow),
    [transactions]
  );

  // Define columns for DataTable
  const columns = useMemo(
    (): TableColumn<TransactionRow>[] => [
      {
        id: "name",
        header: "Name",
        accessorFn: (row) => `${row.name} `,
        cell: ({ row }) => {
          const fullName = `${row.original.name}`;

          return (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="flex-shrink-0 h-8 w-8">
                <AvatarImage
                  src={
                    row.original.avatar ||
                    createAvatarUrl({ avatarUrl: fullName })
                  }
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
        header: "Transaction ID",
        accessorKey: "ticketId",
        enableSorting: true,
      },
      {
        id: "ticketType",
        header: "Transaction Type",
        accessorKey: "ticketType",
        enableSorting: true,
      },
      {
        id: "date",
        header: "Date",
        accessorKey: "date",
        type: "date",
        enableSorting: true,
      },
      {
        id: "amount",
        header: "Amount",
        accessorKey: "amount",
        enableSorting: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        type: "status",
        statusConfig: {
          colorMap: {
            Success: "solid-success",
            Pending: "default",
            Failed: "destructive",
          },
        } as StatusConfig,
        enableSorting: true,
      },
    ],
    []
  );

  // Define actions for DataTable
  const actions = useMemo(
    (): TableAction<TransactionRow>[] => [
      {
        id: "viewDetails",
        label: "View Details",
        onClick: (transaction) => {
          setSelectedTransaction(transaction);
          setIsModalOpen(true);
        },
        className: "text-[#0B5B8C] font-medium",
      },
    ],
    []
  );

  // Table config
  const tableConfig: TableConfig<TransactionRow> = useMemo(
    () => ({
      columns,
      actions,
      enableSelection: true,
      enableSorting: true,
      enableFiltering: true,
      enablePagination: true,
      pageSize, // Use the prop value
      selectionMode: "multiple",
      emptyStateMessage: "No transactions found.",
      loadingMessage: "Fetching transactions...",
      onSelectionChange: () => {},
      responsive: {
        mobileCardView: true,
        stackOnMobile: true,
        showPriorityOnly: true,
      },
    }),
    [columns, actions, pageSize]
  );

  return (
    <div>
      <DataTable
        data={rows}
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
      <TransactionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
