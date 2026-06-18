import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MapPin } from "lucide-react";

interface StatusFilterProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export function StatusFilter({
  label,
  count,
  isActive,
  onClick,
}: StatusFilterProps) {
  const colorMap = {
    All: "#DB3A07",
    Pending: "#031927",
    Preparing: "#DB3A07",
    Ready: "#0066CC",
    "Picked Up": "#7C3AED",
    Delivered: "#10B981",
  };

  const textColor = colorMap[label as keyof typeof colorMap] || "#031927";

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-2 py-4 flex flex-col gap-4 transition-all",
        isActive
          ? "bg-orange-100 border-2 border-orange-500"
          : "bg-white border border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="text-[14px] font-semibold leading-[100%]" style={{ color: isActive ? "#DB3A07" : textColor }}>
        {label}
      </div>
      <div className="text-[16px] font-semibold leading-[100%]" style={{ color: isActive ? "#DB3A07" : textColor }}>
        {count}
      </div>
    </button>
  );
}

interface OrderListItemProps {
  orderNumber: number;
  status: string;
  items: string;
  customer: string;
  location: string;
  prepTime: number;
  riderArrivalTime: number;
  onClick?: () => void;
}

export function OrderListItem({
  orderNumber,
  status,
  items,
  customer,
  location,
  prepTime,
  riderArrivalTime,
  onClick,
}: OrderListItemProps) {
  const statusColors = {
    Preparing: "text-orange-500",
    Ready: "text-green-500",
    Pending: "text-gray-500",
    "Picked Up": "text-blue-500",
    Delivered: "text-green-600",
  };


  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex gap-3">
        {/* Order Image */}
        <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
          <Image
            width={64}
            height={64}
            src="/images/rice.svg"
            alt={items}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-[14px] leading-6.5 text-black">#{orderNumber}</span>
                {/* INCLUDE DATE */}
                <span className="text-[12px] font-semibold leading-6.5 text-[#DB3A07]">{status} <span className="text-[#363C44]">{new Date().toLocaleDateString()}</span></span>
                {/* more options */}
                <button className="text-gray-400 hover:text-gray-600">⋮</button>
                </div>
                <p className="text-[14px] font-semibold leading-6.5 text-[#031927] truncate">{items}</p>
                <p className="text-[12px] font-semibold leading-6.5 text-[#363C44] -mt-1">{customer}</p>
                <p className="text-[12px] font-medium leading-6.5 text-[#68798A] -mt-0.5 flex items-center gap-1"><MapPin className="w-4 h-4 mr-0" /> {location}</p>
            </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-600">Prep Time</div>
          <div className="text-xs font-bold text-orange-500">{prepTime} mins left</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Rider Arrival</div>
          <div className="text-xs font-bold text-blue-600">{riderArrivalTime} mins away</div>
        </div>
        <div className="flex items-center justify-end gap-0">
            <Image src="/images/callrider.svg" alt="Call Icon" width={16} height={16} className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}
