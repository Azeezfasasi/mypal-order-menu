import React from "react";
import { ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Order } from "@/services/api/orders";
import { OrderListItem } from "@/components/orders/orders-filters";

interface OrdersInProgressProps {
  orders: Order[];
  searchQuery?: string;
}

export function OrdersInProgress({ orders, searchQuery = "" }: OrdersInProgressProps) {
  const hasSearchQuery = searchQuery.trim().length > 0;

  if (!orders || orders.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-extrabold leading-6.5 text-[#031927]">Orders In Progress</h2>
          <Link href="/orders" className="text-[#DB3A07] text-[16px] font-medium leading-6 flex items-center gap-1 hover:underline">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-[10px] border border-[#E1E3E7] p-8 text-center">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="md:text-[14px] text-[16px] font-semibold text-[#68798A]">
            {hasSearchQuery ? "No matching orders found" : "No orders in progress"}
          </p>
          <p className="md:text-[12px] text-[14px] text-[#A0AEC0] mt-1">
            {hasSearchQuery
              ? `Try a different search for "${searchQuery.trim()}".`
              : "Great! You&apos;re all caught up. New orders will appear here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-extrabold leading-6.5 text-[#031927]">Orders In Progress</h2>
        <Link href="/orders" className="text-[#DB3A07] text-[16px] font-medium leading-6 flex items-center gap-1 hover:underline">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3 grid grid-cols-2 md:grid-cols-1 gap-3 items-center justify-center">
        {orders.slice(0, 5).map((order) => {
          const firstItem = order?.items?.[0];
          const normalizeDate = (value: unknown) => {
            if (value instanceof Date) return value.toISOString();
            if (typeof value === "string" || typeof value === "number") {
              const date = new Date(value);
              return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
            }
            return undefined;
          };
          const orderDateString = normalizeDate(order?.orderDate ?? order?.createdAt);
          const customerName = order?.customer?.name || "Unknown customer";
          const customerAddress = order?.customer?.address || "Address unavailable";
          const statusText = String(order?.status ?? "Pending");

          return (
            <Link key={order?.id || Math.random().toString()} href={`/orders/${order?.id || ""}`} className="block">
              <OrderListItem
                orderNumber={order?.orderNumber ?? order?.id ?? "N/A"}
                status={statusText}
                itemTitle={firstItem?.name || "Order item"}
                itemImage={firstItem?.imageUrl ? String(firstItem.imageUrl) : undefined}
                customer={customerName}
                location={customerAddress}
                createdAt={orderDateString}
                prepTime={typeof order?.prepTime === "number" ? order.prepTime : 0}
                riderArrivalTime={typeof order?.riderArrivalTime === "number" ? order.riderArrivalTime : 0}
                customerPreference={firstItem?.customerPreference ? String(firstItem.customerPreference) : undefined}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
