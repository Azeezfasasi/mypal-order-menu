"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatDateForApi } from "@/lib/api-helpers";

import type {
  TransactionRow,
  TicketTransactionDetails,
  AccommodationTransactionDetails,
} from "@/types/overview";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRow | null;
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  // Render details based on ticket type
  const details = transaction.details;

  console.log({ details, transaction });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        // aria-describedby="Transaction details"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between mb-6">
          <DialogTitle className="text-lg font-semibold">
            Transaction details
          </DialogTitle>
          {/* <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button> */}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Customer&apos;s name</span>
            <span className="font-medium">{transaction.name}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Transaction ID</span>
            <span className="font-medium">{transaction.ticketId}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Date of transaction</span>
            <span className="font-medium">
              {formatDateForApi(new Date(transaction.date))}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">{transaction.amount}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Transaction status</span>
            <span className="font-medium">{transaction.status}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Transaction type</span>
            <span className="font-medium">
              {transaction.transactionType || "Accommodation"}
            </span>
          </div>

          {/* Show details based on ticket type */}
          {transaction.ticketType === "Ticket" && details && (
            <>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Visitation Date</span>
                <span className="font-medium">
                  {(details as TicketTransactionDetails).visitation_date}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Business Type</span>
                <span className="font-medium">
                  {(details as TicketTransactionDetails).business_type}
                </span>
              </div>
            </>
          )}
          {transaction.ticketType === "Accommodation" && details && (
            <>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Check-in Date</span>
                <span className="font-medium">
                  {(details as AccommodationTransactionDetails).check_in_date}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Check-out Date</span>
                <span className="font-medium">
                  {(details as AccommodationTransactionDetails).check_out_date}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">No. of Adults</span>
                <span className="font-medium">
                  {(details as AccommodationTransactionDetails).no_of_adults}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">No. of Children</span>
                <span className="font-medium">
                  {(details as AccommodationTransactionDetails).no_of_children}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Individuals</span>
                <span className="font-medium">
                  {
                    (details as AccommodationTransactionDetails)
                      .total_individuals
                  }
                </span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
