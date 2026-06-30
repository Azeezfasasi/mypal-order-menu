"use client"

import React, { useState, useMemo, useEffect } from "react";
import { StatusFilter, OrderListItem } from "@/components/orders/orders-filters";
import { useOrders, useOrderStatusCounts } from "@/hooks/use-orders";
import { useAuthStore } from "@/stores/auth-store";
import { Order } from "@/services/api/orders";
import { AlertCircle, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Map display labels to API status values
const STATUS_API_MAP: Record<string, string | undefined> = {
  All: undefined,
  Processing: "processing",
  Pending: "pending",
  Preparing: "preparing",
  Ready: "ready",
  "Picked Up": "on-transit",
  Delivered: "completed",
  Cancelled: "cancelled",
};

export default function OrdersPage() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const business = useAuthStore((state) => state.business);

  const pageSize = 10;
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the status filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  // Lightweight call (limit: 1) just to get total count and per-status counts from
  // the API response metadata — does not drive the visible list.
  const countsFilters = useMemo(
    () => ({ limit: 1, page: 1, sort: "createdAt", order: "DESC" as const }),
    []
  );
  const { total: totalOrders } = useOrders(countsFilters);

  const orderFilters = useMemo(
    () => ({
      limit: pageSize,
      page: page,
      sort: "createdAt",
      order: "DESC" as const,
      ...(STATUS_API_MAP[selectedStatus] && { status: STATUS_API_MAP[selectedStatus] }),
    }),
    [page, selectedStatus]
  );

  const { orders: apiOrders, total: filteredTotal, loading, error } = useOrders(orderFilters);

  // Accurate per-status totals fetched on mount (6 parallel lightweight requests).
  const { counts: mountCounts } = useOrderStatusCounts();

  // Counts updated when the user visits a specific filter — always the freshest value.
  const [visitedCounts, setVisitedCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (selectedStatus === "All" || loading || filteredTotal === 0) return;
    setVisitedCounts((prev) => ({ ...prev, [selectedStatus]: filteredTotal }));
  }, [selectedStatus, loading, filteredTotal]);

  const getPillCount = (label: string): number => {
    if (label === "All") return totalOrders;
    // Active filter — accurate server total from the filtered query.
    if (label === selectedStatus) return filteredTotal;
    // Already visited this filter this session — use that result.
    if (visitedCounts[label] !== undefined) return visitedCounts[label];
    // On-mount fetch resolved — use those accurate totals.
    if (mountCounts[label] !== undefined) return mountCounts[label];
    return 0;
  };

  // Check if error is an authorization error
  const isAuthorizationError = (error: string | null) => {
    return error && (error.includes("not authorized") || error.includes("403"));
  };

  const getAuthErrorMessage = (error: string | null) => {
    if (!error) return null;
    const match = error.match(/Required:\s*(.+?)(?:,|$)/);
    const required = match ? match[1].trim() : "Iconic Delicacies";
    return `You're signed in with the wrong account. Your current account (${business?.category?.name || "this account"}) doesn't have access to this section. Please sign in or switch to an account that has access to ${required}.`;
  };

  const parseOrderDate = (source: unknown): string | undefined => {
    if (!source) return undefined;
    const value = typeof source === "string" || typeof source === "number" || source instanceof Date
      ? source
      : String(source);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  // Only use API orders - no fallback to mock
  const allOrders = apiOrders;

  // Status is filtered server-side; only apply search query client-side
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return allOrders;
    const query = searchQuery.toLowerCase();
    return allOrders.filter((order: Order) =>
      String(order.id || "").toLowerCase().includes(query) ||
      String(order.orderNumber || "").toLowerCase().includes(query) ||
      String(order.customer?.name || "").toLowerCase().includes(query)
    );
  }, [searchQuery, allOrders]);

  return (
    <div className="space-y-6 bg-linear-to-r from-[#B2D5FF]/10 to-blue-[#B2D5FF]/10 px-0">
      {/* Error Message */}
      {error && (
        <div className={`border rounded-lg p-4 flex gap-3 ${isAuthorizationError(error) ? 'bg-yellow-50 border-yellow-400' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isAuthorizationError(error) ? 'text-yellow-600' : 'text-red-600'}`} />
          <div>
            <p className={`text-sm font-semibold ${isAuthorizationError(error) ? 'text-yellow-800' : 'text-red-800'}`}>
              {isAuthorizationError(error) ? 'Account Access Issue' : 'Failed to load orders'}
            </p>
            <p className={`md:text-xs text-base ${isAuthorizationError(error) ? 'text-yellow-700' : 'text-red-700'} mt-1`}>
              {isAuthorizationError(error) 
                ? getAuthErrorMessage(error)
                : error
              }
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="rounded-full border border-slate-200 bg-white p-2 shadow-sm hover:border-slate-300">
              <Image src="/images/arrowleft.svg" alt="Back" width={16} height={16} className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[28px] font-extrabold leading-[1.1] text-slate-950">Orders</h1>
              <p className="text-sm text-slate-500">Track every order in one place.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder="Search order ID, customer name, item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-[40px] border border-slate-200 bg-white px-5 pl-12 shadow-sm"
          />
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-3 gap-3 overflow-x-auto pb-2">
          <StatusFilter
            label="All"
            count={getPillCount("All")}
            isActive={selectedStatus === "All"}
            onClick={() => setSelectedStatus("All")}
          />
          <StatusFilter
            label="Processing"
            count={getPillCount("Processing")}
            isActive={selectedStatus === "Processing"}
            onClick={() => setSelectedStatus("Processing")}
          />
          <StatusFilter
            label="Pending"
            count={getPillCount("Pending")}
            isActive={selectedStatus === "Pending"}
            onClick={() => setSelectedStatus("Pending")}
          />
          <StatusFilter
            label="Preparing"
            count={getPillCount("Preparing")}
            isActive={selectedStatus === "Preparing"}
            onClick={() => setSelectedStatus("Preparing")}
          />
          <StatusFilter
            label="Ready"
            count={getPillCount("Ready")}
            isActive={selectedStatus === "Ready"}
            onClick={() => setSelectedStatus("Ready")}
          />
          <StatusFilter
            label="Picked Up"
            count={getPillCount("Picked Up")}
            isActive={selectedStatus === "Picked Up"}
            onClick={() => setSelectedStatus("Picked Up")}
          />
          <StatusFilter
            label="Delivered"
            count={getPillCount("Delivered")}
            isActive={selectedStatus === "Delivered"}
            onClick={() => setSelectedStatus("Delivered")}
          />
          <StatusFilter
            label="Cancelled"
            count={getPillCount("Cancelled")}
            isActive={selectedStatus === "Cancelled"}
            onClick={() => setSelectedStatus("Cancelled")}
          />
        </div>
      </div>

      {/* Sort and Results */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-0">
        <h2 className="font-bold text-[12px] leading-6.5 text-[#031927]">
          {selectedStatus === "All" ? "All Orders" : selectedStatus} ({selectedStatus === "All" ? totalOrders : filteredTotal})
        </h2>
      </div>


      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-[#DB3A07]" />
              <p className="md:text-sm text-[18px] text-gray-600">Loading orders...</p>
              <p className="md:text-xs text-[14px] text-gray-500">If this takes too long, please check your account access or try refreshing</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12 border border-slate-200 rounded-[24px] bg-white shadow-sm">
            <div className="text-center max-w-sm">
              <div className="text-slate-400 mb-4">
                <svg className="w-14 h-14 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
               </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900">No orders match that search</p>
              <p className="mt-2 text-sm text-slate-500">Clear the search or choose a different status filter to see your latest orders.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            {filteredOrders.map((order: Order) => (
              <OrderListItem
                key={order.id}
                orderNumber={order.orderNumber ?? order.id}
                status={order.status || "Unknown"}
                itemTitle={order.items?.[0]?.name ? String(order.items[0].name) : "Order item"}
                itemImage={order.items?.[0]?.imageUrl ? String(order.items[0].imageUrl) : undefined}
                customer={order.customer?.name || "Unknown"}
                location={order.customer?.address || "N/A"}
                createdAt={parseOrderDate(order.createdAt ?? order.orderDate)}
                prepTime={order.prepTime || 0}
                riderArrivalTime={order.riderArrivalTime || 0}
                customerPreference={order.items?.[0]?.customerPreference ? String(order.items[0].customerPreference) : undefined}
                onClick={() => router.push(`/orders/${order.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex flex-row items-center justify-end gap-2 p-0 md:mb-40 mb-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={apiOrders.length < pageSize}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
