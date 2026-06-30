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

const statusColorMap: Record<string, string> = {
  All: "text-orange-700 bg-orange-100 border-orange-200",
  Processing: "text-[#92400E] bg-[#FEF3C7] border-[#F59E0B]",
  Pending: "text-[#B45309] bg-[#FFEDD5] border-[#FCD34D]",
  Preparing: "text-[#BE123C] bg-[#FCE7F3] border-[#F9A8D4]",
  Ready: "text-[#0C4A6E] bg-[#E0F2FE] border-[#7DD3FC]",
  "Picked Up": "text-[#6D28D9] bg-[#EEF2FF] border-[#C4B5FD]",
  Delivered: "text-[#047857] bg-[#D1FAE5] border-[#86EFAC]",
  Cancelled: "text-[#9F1239] bg-[#FFF1F2] border-[#FECDD3]",
};

export function StatusFilter({
  label,
  count,
  isActive,
  onClick,
}: StatusFilterProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-3xl px-4 md:px-2 py-4 md:py-2 flex flex-col items-start gap-2 transition-all zmin-w-[130px] text-left",
        isActive ? "border-2 border-orange-400" : `border ${statusColorMap[label] ?? "border-slate-200 bg-white"}`,
      )}
    >
      <span className={cn("text-[13px] md:text-[11px] mx-auto font-semibold uppercase tracking-[0.12em]", isActive ? "text-[#C2410C]" : "text-slate-500")}>{label}</span>
      <span className={cn("text-[18px] font-bold mx-auto", isActive ? "text-[#C2410C]" : "text-slate-900")}>{count}</span>
    </button>
  );
}

interface OrderListItemProps {
  orderNumber: string | number;
  status: string;
  itemTitle: string;
  itemImage?: string;
  customer: string;
  location: string;
  createdAt?: string;
  prepTime: number;
  riderArrivalTime: number;
  customerPreference?: string;
  onClick?: () => void;
}

const statusBadgeMap: Record<string, string> = {
  Processing: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]",
  Pending: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]",
  Preparing: "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]",
  Ready: "bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]",
  "Picked Up": "bg-[#EDE9FE] text-[#6D28D9] border-[#C4B5FD]",
  Delivered: "bg-[#DCFCE7] text-[#166534] border-[#86EFAC]",
  Cancelled: "bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]",
};

const formatStatusLabel = (status: string) => {
  if (!status) return "Unknown";
  const lower = status.toLowerCase();
  if (lower === "on-transit") return "Picked Up";
  if (lower === "completed") return "Delivered";
  return status
    .toString()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatCreatedAt = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export function OrderListItem({
  orderNumber,
  status,
  itemTitle,
  itemImage,
  customer,
  location,
  createdAt,
  prepTime,
  riderArrivalTime,
  customerPreference,
  onClick,
}: OrderListItemProps) {
  const statusLabel = formatStatusLabel(status);
  const createdAtLabel = formatCreatedAt(createdAt);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="grid grid-cols-2 md:grid-cols-1 p-5 md:px-2 w-full">
          <div className="flex flex-col justify-start items-start gap-4">
            {/* Order details */}
            <div className="flex flex-row items-start justify-between gap-4">
              <div className="relative sh-[120px] sw-[140px] overflow-hidden rounded-[24px] bg-slate-100">
                {itemImage ? (
                  <Image src={itemImage} alt={itemTitle || "Order item"} width={85} height={82} className="object-cover w-[170px] h-[100px]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] md:text-[11px] uppercase leading-[26px] font-extrabold stracking-[0.24em] text-black truncate">#{orderNumber}</p>
                <div className="flex items-center gap-2">
                  <span className={cn("hidden md:inline-flex lg:inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold", statusBadgeMap[statusLabel] ?? "bg-slate-100 text-slate-700 border-slate-200")}>{statusLabel}</span>
                  {createdAtLabel ? (
                    <p className="mt-1 text-xs text-slate-400">{createdAtLabel}</p>
                  ) : null}
                </div>
                <h3 className="mt-1 text-[14px] leading-[26px] font-semibold text-[#031927] truncate">{itemTitle}</h3>
                <p className="text-[12px] leading-[26px] font-semibold text-[#363C44]">{customer}</p>
                <div className="flex items-center gap-2 text-[12px] leading-[26px] font-medium text-[#68798A]">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              </div>
              <span className={cn("md:hidden lg:hidden inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold", statusBadgeMap[statusLabel] ?? "bg-slate-100 text-slate-700 border-slate-200")}>{statusLabel}</span>
            </div>

            {/* Prep time and rider time */}
            <div className="w-full grid gap-3 grid-cols-2 flex-1 min-w-[400px] md:min-w-0 lg:min-w-[300px] border-t border-slate-200 pt-2">
            {/* <div className="w-full flex flex-row justify-start flex-1 min-w-[300px] border-t border-slate-200 pt-2"> */}
              <div className="rounded-[24px] bg-slate-50 p-4 flex-1">
                <p className="text-[12px] uppercase leading-[26px] font-medium text-[#68798A]">Prep time</p>
                <p className="text-[14px] leading-[26px] font-semibold text-[#DB3A07]">{prepTime} mins left</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-1/2 rounded-full bg-[#F97316]" />
                </div>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4 flex-1">
                <p className="text-[12px] uppercase leading-[26px] font-medium text-[#68798A]">Rider arrival</p>
                <p className="text-[14px] leading-[26px] font-semibold text-[#0EA5E9]">{riderArrivalTime} mins away</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-1/2 rounded-full bg-[#0EA5E9]" />
                </div>
              </div>
            </div>

            {customerPreference ? (
              <div className="rounded-[24px] bg-[#FEF8E1] border border-[#FDE68A] px-2 py-1 text-[14px] leading-[29.44px] font-medium text-[#8E4E09] mx-auto flex items-center justify-center gap-1 flex-1 xmin-w-[100%] lg:min-w-[40vw]">
                <span className="font-medium">Customer preference:</span> <span className="font-bold">{customerPreference}</span>
              </div>
            ) : null}
        </div>
      </div>
    </div>
  );
}
