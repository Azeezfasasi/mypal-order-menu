// Example usage
import { type ColumnDef } from "@tanstack/react-table";

import { useEffect, useState } from "react";

import {
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTable } from ".";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import mockUserData, { TableSampleUserType } from "./sample-data";

// Define your columns
export const columns: ColumnDef<TableSampleUserType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <div>{row.getValue("role")}</div>,
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={cn(
            status === "active" && "bg-green-500",
            status === "inactive" && "bg-red-500",
            status === "pending" && "bg-yellow-500",
          )}
        >
          {status}
        </Badge>
      );
    },
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: ({ row }) => {
      const date = row.getValue("lastLogin") as Date;
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
];

// Example Component Implementation

// Client-side example
export function ClientSideTable() {
  const [data, setData] = useState<TableSampleUserType[]>([]);

  useEffect(() => {
    // Fetch your data here or use mock data
    const mockData: TableSampleUserType[] = mockUserData;

    setData(mockData);
  }, []);

  return (
    <DataTable
      data={data}
      columns={columns}
      mode="client"
      filtering={{
        facets: [
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Pending", value: "pending" },
            ],
          },
          {
            columnId: "role",
            title: "Role",
            options: [
              { label: "Admin", value: "Admin" },
              { label: "User", value: "User" },
              { label: "Editor", value: "Editor" },
            ],
          },
        ],
      }}
    />
  );
}

// Server-side example
export function ServerSideTable() {
  const [data, setData] = useState<TableSampleUserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // Fetch data from API with pagination, sorting, and filtering parameters
        // This is where you'd make your API call

        // Example:
        // const response = await fetch(
        //   `/api/users?page=${pagination.pageIndex}&size=${pagination.pageSize}&sort=${sorting[0]?.id}&order=${sorting[0]?.desc ? 'desc' : 'asc'}&filters=${JSON.stringify(filtering)}`
        // );
        // const result = await response.json();

        // Mock response for demonstration
        const mockResponse = {
          data: mockUserData,
          totalItems: mockUserData.length,
          pageCount: 5,
        };

        setData(mockResponse.data);
        setTotalItems(mockResponse.totalItems);
        setPageCount(mockResponse.pageCount);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [pagination, sorting, filtering]);

  return (
    <DataTable
      data={data}
      columns={columns}
      mode="server"
      loading={loading}
      totalItems={totalItems}
      pagination={{
        pageCount,
        initialState: pagination,
        onPaginationChange: setPagination,
      }}
      sorting={{
        initialState: sorting,
        onSortingChange: setSorting,
      }}
      filtering={{
        initialState: filtering,
        onFilteringChange: setFiltering,
        facets: [
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Pending", value: "pending" },
            ],
          },
          {
            columnId: "role",
            title: "Role",
            options: [
              { label: "Admin", value: "Admin" },
              { label: "User", value: "User" },
              { label: "Editor", value: "Editor" },
            ],
          },
        ],
      }}
      hideSearch={true}
      className="text-gray-500"
    />
  );
}
