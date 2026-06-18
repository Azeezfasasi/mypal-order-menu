"use client"

import React, { useState, useMemo } from "react";
import { StatusFilter, OrderListItem } from "@/components/orders/orders-filters";
import { useOrders } from "@/hooks/use-orders";
import { Order } from "@/services/api/orders";
import { AlertCircle, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OrdersPage() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { orders: apiOrders, loading, error } = useOrders({
    limit: 50,
    sort: "createdAt",
    order: "DESC"
  });

  // Only use API orders - no fallback to mock
  const allOrders = apiOrders;

  // Filter orders by status and search
  const filteredOrders = useMemo(() => {
    let filtered = selectedStatus === "All" 
      ? allOrders 
      : allOrders.filter((order: Order) => {
          const orderStatus = (order.status || "").toLowerCase();
          const selectedLower = selectedStatus.toLowerCase();
          return orderStatus.includes(selectedLower);
        });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order: Order) => 
        String(order.id || "").toLowerCase().includes(query) ||
        String(order.orderNumber || "").toLowerCase().includes(query) ||
        String(order.customer?.name || "").toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedStatus, searchQuery, allOrders]);

  return (
    <div className="space-y-6 bg-linear-to-r from-[#B2D5FF]/10 to-blue-[#B2D5FF]/10 px-0">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to load orders</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-start gap-2 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => router.back()} className="text-gray-600"><Image src="/images/arrowleft.svg" alt="Back" width={16} height={16} className="w-6 h-6" /></button>
        </div>
        <div className="flex flex-col items-start justify-start gap-0 mb-1">
          <h1 className="text-[24px] font-extrabold leading-6.5 text-[#031927]">Orders</h1>
          <p className="text-[16px] font-medium leading-6.5 text-[#68798A]">Manage and track all orders</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Image
            width={20}
            height={20}
            src="/images/search.svg"
            alt="Search Icon"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <Input
            type="text"
            placeholder="Search order id, customer name, item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 bg-white rounded-[100px] border border-[#E1E3E7]"
        />
      </div>

      {/* Status Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 md:grid-cols-3 gap-2 overflow-x-auto pb-2">
          <StatusFilter
            label="All"
            count={allOrders.length}
            isActive={selectedStatus === "All"}
            onClick={() => setSelectedStatus("All")}
          />
          <StatusFilter
            label="Pending"
            count={allOrders.filter((o: Order) => o.status?.toLowerCase().includes("pending")).length}
            isActive={selectedStatus === "Pending"}
            onClick={() => setSelectedStatus("Pending")}
          />
          <StatusFilter
            label="Preparing"
            count={allOrders.filter((o: Order) => o.status?.toLowerCase().includes("preparing")).length}
            isActive={selectedStatus === "Preparing"}
            onClick={() => setSelectedStatus("Preparing")}
          />
          <StatusFilter
            label="Ready"
            count={allOrders.filter((o: Order) => o.status?.toLowerCase().includes("ready")).length}
            isActive={selectedStatus === "Ready"}
            onClick={() => setSelectedStatus("Ready")}
          />
          <StatusFilter
            label="Picked Up"
            count={allOrders.filter((o: Order) => o.status?.toLowerCase().includes("picked")).length}
            isActive={selectedStatus === "Picked Up"}
            onClick={() => setSelectedStatus("Picked Up")}
          />
          <StatusFilter
            label="Delivered"
            count={allOrders.filter((o: Order) => o.status?.toLowerCase().includes("delivered")).length}
            isActive={selectedStatus === "Delivered"}
            onClick={() => setSelectedStatus("Delivered")}
          />
        </div>
      </div>

      {/* Sort and Results */}
      <div className="flex items-center justify-between gap-2 p-0">
        <h2 className="font-bold text-[12px] leading-6.5 text-[#031927]">
          {selectedStatus === "All" ? "All Orders" : selectedStatus} ({filteredOrders.length})
        </h2>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-[#DB3A07]" />
              <p className="text-sm text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">No orders found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
            </div>
          </div>
        ) : (
          filteredOrders.map((order: Order) => (
            <OrderListItem
              key={order.id}
              orderNumber={typeof order.orderNumber === "string" ? parseInt(order.orderNumber, 10) : order.orderNumber || 0}
              status={order.status || "Unknown"}
              items={(order.items?.map((i) => i.name).join(", ")) || "N/A"}
              customer={order.customer?.name || "Unknown"}
              location={order.customer?.address || "N/A"}
              prepTime={order.prepTime || 0}
              riderArrivalTime={order.riderArrivalTime || 0}
              onClick={() => router.push(`/orders/${order.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
