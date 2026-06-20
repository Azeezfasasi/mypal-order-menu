import React from "react";
import { ChevronRight, MapPin } from "lucide-react";
// import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Order } from "@/types/order";
import Image from "next/image";

interface OrdersInProgressProps {
  orders: Order[];
}

export function OrdersInProgress({ orders }: OrdersInProgressProps) {
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
          <p className="md:text-[14px] text-[16px] font-semibold text-[#68798A]">No orders in progress</p>
          <p className="md:text-[12px] text-[14px] text-[#A0AEC0] mt-1">Great! You&apos;re all caught up. New orders will appear here.</p>
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

      <div className="space-y-3">
        {orders.slice(0, 2).map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <div className="bg-white rounded-[10px] border border-[#DBDBDB] p-3 cursor-pointer mb-4">
              <div className="flex gap-3">
                {/* Order Image */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                  <Image
                    width={64}
                    height={64}
                    src="/images/rice.svg"
                    alt={order.items[0]?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-[14px] leading-6.5 text-black">#{order.orderNumber}</span>
                    {/* INCLUDE DATE */}
                    <span className="text-[12px] font-semibold leading-6.5 text-[#DB3A07]">{order.status} <span className="text-[#363C44]">{order.orderDate.toLocaleDateString()}</span></span>
                  </div>
                  <p className="text-[14px] font-semibold leading-6.5 text-[#031927] truncate">{order.items[0]?.name}</p>
                  <p className="text-[12px] font-semibold leading-6.5 text-[#363C44] -mt-1">{order.customer.name}</p>
                  <p className="text-[12px] font-medium leading-6.5 text-[#68798A] -mt-0.5 flex items-center gap-1"><MapPin className="w-4 h-4 mr-0" />{order.customer.address}</p>
                </div>
              </div>

              {/* Times */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div>
                        <div className="text-[12px] font-medium leading-6.5 text-[#68798A]">Prep Time</ div>
                        <div className="text-[14px] font-semibold leading-6.5 text-[#DB3A07]">
                            {order.prepTime} mins left
                        </div>
                    </div>
                    <div>
                        <div className="text-[12px] font-medium leading-6.5 text-[#68798A]">Rider Arrival</div>
                        <div className="text-[14px] font-semibold leading-6.5 text-[#114CCC]">
                            {order.riderArrivalTime} mins away
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-0">
                        <Image src="/images/callrider.svg" alt="Call Icon" width={16} height={16} className="w-10 h-10" />
                    </div>
                </div>

              {/* Customer Preference */}
              {/* {order.items[0]?.customerPreference && (
                <div className="mt-3 bg-yellow-50 p-2 rounded text-xs text-gray-700 flex items-start gap-2">
                  <span>📝</span>
                  <span>{order.items[0].customerPreference}</span>
                </div>
              )} */}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
