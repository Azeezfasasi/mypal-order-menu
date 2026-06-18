"use client";

import { Eye } from "lucide-react";
import { useMemo } from "react";

import DataTable from "@/components/data-table/enhanced_table_component";
import { TableConfig } from "@/components/data-table/enhanced_table_types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createAvatarUrl } from "@/lib/avatar-utils";
import { calculateAgeRange } from "@/lib/revenue-reports-utils";
import { IUser } from "@/types";

export interface ProcessedCustomer {
  id: string;
  name: string;
  avatar: string | null;
  orderFrequency: string;
  ageRange: string;
  gender: string;
  location: string;
  original: IUser;
}

interface CustomerDemographicsTableProps {
  customers: IUser[] | undefined;
  isLoading: boolean;
  onViewCustomer?: (customer: ProcessedCustomer) => void;
  onSelectionChange?: (customers: ProcessedCustomer[]) => void;
  className?: string;
}

export default function CustomerDemographicsTable({
  customers,
  isLoading,
  onViewCustomer,
  onSelectionChange,
  className,
}: CustomerDemographicsTableProps) {
  // Memoized data processing
  const processedCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.map(
      (customer: IUser): ProcessedCustomer => ({
        id: customer.id,
        name:
          `${customer.firstname || ""} ${customer.lastname || ""}`.trim() ||
          "N/A",
        avatar: customer.image_url,
        orderFrequency: customer.loyality_point?.toString() || "0",
        ageRange: calculateAgeRange(customer.birthday),
        gender: customer.gender || "Unknown",
        location: customer.address || "Unknown",
        original: customer,
      })
    );
  }, [customers]);

  // DataTable configuration
  const customerTableConfig: TableConfig<ProcessedCustomer> = useMemo(
    () => ({
      enableSelection: true,
      enableSorting: true,
      enablePagination: true,
      pageSize: 10,
      selectionMode: "multiple",
      searchPlaceholder: "Search customers...",
      emptyStateMessage: "No customers found matching your criteria.",
      loadingMessage: "Loading customers...",
      columns: [
        {
          id: "name",
          header: "Name",
          accessorKey: "name",
          cell: ({ row }) => (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="flex-shrink-0 h-8 w-8">
                <AvatarImage
                  src={
                    row.original.avatar ||
                    createAvatarUrl({ avatarUrl: row.original.name })
                  }
                  alt={row.original.name}
                />
                <AvatarFallback className="text-xs">
                  {row.original.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium truncate">{row.original.name}</span>
            </div>
          ),
          enableSorting: true,
          size: 200,
          minSize: 150,
        },
        {
          id: "orderFrequency",
          header: "Loyalty Points",
          accessorKey: "orderFrequency",
          cell: ({ row }) => (
            <span className="font-medium">{row.original.orderFrequency}</span>
          ),
          enableSorting: true,
          size: 120,
        },
        {
          id: "ageRange",
          header: "Age Range",
          accessorKey: "ageRange",
          enableSorting: true,
          size: 100,
        },
        {
          id: "gender",
          header: "Gender",
          accessorKey: "gender",
          enableSorting: true,
          size: 80,
        },
        {
          id: "location",
          header: "Location",
          accessorKey: "location",
          cell: ({ row }) => (
            <span className="text-sm text-gray-600">
              {row.original.location}
            </span>
          ),
          enableSorting: true,
          size: 150,
          minSize: 100,
        },
      ],
      actions: [
        {
          id: "view",
          label: "View Details",
          icon: Eye,
          variant: "ghost",
          onClick: (customer) => {
            if (onViewCustomer) {
              onViewCustomer(customer);
            } else {
              console.log("View customer:", customer);
            }
          },
          className: "text-primary-600 hover:text-primary-800",
        },
      ],
      onSelectionChange: (selectedCustomers) => {
        if (onSelectionChange) {
          onSelectionChange(selectedCustomers);
        } else {
          console.log("Selected customers:", selectedCustomers);
        }
      },
    }),
    [onViewCustomer, onSelectionChange]
  );

  return (
    <div className={`w-full ${className || ""}`}>
      <DataTable
        data={processedCustomers}
        config={customerTableConfig}
        isLoading={isLoading}
        className="w-full"
      />
    </div>
  );
}
