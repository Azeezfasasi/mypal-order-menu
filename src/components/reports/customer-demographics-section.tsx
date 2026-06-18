"use client";

import CustomerDemographicsTable, {
  ProcessedCustomer,
} from "@/components/reports/customer-demographics-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IUser } from "@/types";
import { PaginationResult } from "@/types/api";
import { FilterType } from "@/types/reports";
import { SearchIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type CustomerDemographicsFilter = FilterType | "all";

interface CustomerDemographicsSectionProps {
  customerType: CustomerDemographicsFilter;
  location: string;
  filteredCustomersData: PaginationResult<IUser[]> | undefined;
  loadingFiltered: boolean;
  onCustomerTypeChange: (value: CustomerDemographicsFilter) => void;
  onLocationChange: (value: string) => void;
  onViewCustomer: (customer: ProcessedCustomer) => void;
  onSelectionChange: (customers: ProcessedCustomer[]) => void;
}

export default function CustomerDemographicsSection({
  customerType,
  location,
  filteredCustomersData,
  loadingFiltered,
  onCustomerTypeChange,
  onLocationChange,
  onViewCustomer,
  onSelectionChange,
}: CustomerDemographicsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex md:flex-col md:items-start justify-between gap-4 flex-row items-center">
        <h2 className="text-xl font-semibold">Customer Demographics</h2>
        <div className="flex md:flex-col gap-3 flex-row">
          <Select
            value={customerType}
            onValueChange={(value) =>
              onCustomerTypeChange(value as CustomerDemographicsFilter)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Customer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="new-customers">New customers</SelectItem>
              <SelectItem value="returning-customers">
                Returning customers
              </SelectItem>
              <SelectItem value="recurring-customers">
                Recurring customers
              </SelectItem>
            </SelectContent>
          </Select>
          <form
            className="flex gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const value = formData.get("location")?.toString() || "";
              onLocationChange(value);
            }}
          >
            <Input
              name="location"
              type="text"
              defaultValue={location}
              placeholder="Search location..."
              className="border rounded px-3 py-2 w-full sm:w-[180px]"
            />
            <Button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded"
            >
              <SearchIcon className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <CustomerDemographicsTable
        customers={filteredCustomersData?.data}
        isLoading={loadingFiltered}
        onViewCustomer={onViewCustomer}
        onSelectionChange={onSelectionChange}
      />
    </div>
  );
}
