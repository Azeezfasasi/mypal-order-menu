"use client";

import React, { useState, useEffect } from "react";
import { useOrderById, useUpdateOrderStatus, useNotifyCustomer } from "@/hooks/use-orders";
import { OrderStatus } from "@/types/enums";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Phone, Camera, PhoneCall, AlertCircle, Loader, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);

  // Fetch order from API only - no mock data
  const { order, loading: orderLoading, error: orderError } = useOrderById(orderId);
  const { updateStatus, loading: updateLoading } = useUpdateOrderStatus();
  const { notify, loading: notifyLoading } = useNotifyCustomer();

  const orderTimeline = order ? (Array.isArray(order.timeline) ? order.timeline : []) : [];
  const [localStatus, setLocalStatus] = useState<string>("pending");
  const [localTimeline, setLocalTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (!order) {
      return;
    }

    setLocalStatus(String(order.status || "pending").toLowerCase());
    setLocalTimeline(orderTimeline);
  }, [order, orderTimeline]);

  const transitionMap: Record<string, OrderStatus[]> = {
    pending: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    processing: [OrderStatus.READY, OrderStatus.CANCELLED],
    preparing: [OrderStatus.READY, OrderStatus.CANCELLED],
    ready: [OrderStatus.ONTRANSIT, OrderStatus.CANCELLED],
    "on-transit": [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    completed: [],
    cancelled: [],
  };

  const canTransitionTo = (status: OrderStatus) => {
    const normalized = String(localStatus || order?.status || "pending").toLowerCase();
    return transitionMap[normalized]?.includes(status) ?? false;
  };

  const canMarkReady = canTransitionTo(OrderStatus.READY);

  const updateLocalTimeline = (status: string) => {
    setLocalTimeline((previous) => {
      const normalized = status.toLowerCase();
      const hasEvent = previous.some((event: any) => String(event.status).toLowerCase() === normalized);

      const mapped = previous.map((event: any) => ({
        ...event,
        isCurrentStatus: String(event.status).toLowerCase() === normalized,
      }));

      if (hasEvent) {
        return mapped;
      }

      return [
        ...mapped,
        {
          status: normalized,
          timestamp: new Date().toISOString(),
          isCurrentStatus: true,
        },
      ];
    });
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (!canTransitionTo(status)) {
      toast.error("This transition is not allowed from the current status.");
      return;
    }

    try {
      await updateStatus(orderId, status);
      setLocalStatus(String(status).toLowerCase());
      updateLocalTimeline(status);
      toast.success(`Order status changed to ${status.replace("on-transit", "Picked up").replace("completed", "Delivered")}.`);
    } catch (err) {
      toast.error("Failed to update order status. Please try again.");
      console.error(err);
    }
  };

  const handleNotifyCustomer = async () => {
    try {
      await notify(orderId);
      alert("Customer notified!");
      setMealPhoto(null);
    } catch (err) {
      alert("Failed to notify customer");
      console.error(err);
    }
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-[#DB3A07] mx-auto mb-3" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2">API Error</h1>
          <p className="text-gray-600 mb-4 max-w-md">{orderError}</p>
          <div className="flex gap-2 justify-center">
            <Link href="/orders" className="text-orange-500 hover:underline">
              Back to Orders
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="text-orange-500 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    processing: "bg-orange-50 text-orange-700 border-orange-200",
    preparing: "bg-orange-50 text-orange-700 border-orange-200",
    ready: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-gray-50 text-gray-700 border-gray-200",
    "on-transit": "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  if (!order) {
    return null; // Should not reach here due to loading state
  }

  const statusLabel = String(order.status || "processing").replace(/^(\w)/, (match) => match.toUpperCase());

  const parseApiDate = (source: unknown): Date | null => {
    if (!source) return null;
    const value = typeof source === "string" || typeof source === "number" || source instanceof Date
      ? source
      : String(source);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const orderDate = parseApiDate(order.createdAt ?? order.orderDate);
  const formattedOrderDate = orderDate
    ? orderDate.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
  const totalPrice = typeof order.totalPrice === "number" ? order.totalPrice : Number(order.totalPrice) || 0;
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const itemCount = orderItems.length;
  const currentStatus = String(localStatus || order?.status || "pending").toLowerCase();

  const timelineSteps = [
    { id: "pending", label: "Order received" },
    { id: "processing", label: "Preparing" },
    { id: "ready", label: "Ready for pickup" },
    { id: "on-transit", label: "Picked up" },
    { id: "completed", label: "Delivered" },
  ];

  const currentStepIndex = timelineSteps.findIndex((step) => step.id === currentStatus);
  const statusEventTimes = new Map(
    (localTimeline.length > 0 ? localTimeline : orderTimeline)
      .filter((event: any) => event?.status)
      .map((event: any) => [String(event.status).toLowerCase(), parseApiDate(event.timestamp)]),
  );

  const getStepTime = (id: string) => {
    const stepDate = statusEventTimes.get(id);
    return stepDate
      ? stepDate.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        })
      : "";
  };

  const prepTime = Number(order.prepTime ?? 0);
  const riderArrivalTime = Number(order.riderArrivalTime ?? 0);
  const primaryItem = orderItems[0];
  const prepProgress = prepTime <= 0 ? 100 : Math.max(12, Math.min(100, 100 - Math.round((prepTime / 30) * 100)));
  const riderProgress = riderArrivalTime <= 0 ? 100 : Math.max(12, Math.min(100, 100 - Math.round((riderArrivalTime / 30) * 100)));

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-r from-[#F7FBFF] via-white to-[#F7FBFF] px-6 py-6 md:px-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-slate-200 bg-white p-2 shadow-sm hover:border-slate-300"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Order details</p>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 justify-between md:justify-start">
          <p className="text-[14px] leading-[26px] font-semibold text-[#68798A]">Order <span className="text-[15px] text-[#363C44]">#{order.orderNumber}</span></p>
          <div className={`inline-flex items-center rounded-full md:w-fit border px-4 py-2 text-sm font-semibold ${statusColors[String(order.status).toLowerCase()] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
            {statusLabel}
          </div>
        </div>

        {/* order prep and rider time */}
        <div className="grid gap-4 grid-cols-2">
          <div className="rounded-[24px] bg-[#F8FAFC] p-4 md:p-1">
            <p className="text-[12px] leading-[26px] font-medium uppercase tracking-[0.24em] text-[#68798A]">Prep time</p>
            <p className="text-[14px] leading-[26px] font-semibold text-[#DB3A07]">{order.prepTime || 0} mins left</p>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${prepProgress}%` }} />
            </div>
          </div>
          <div className="rounded-[24px] bg-[#F8FAFC] p-4 md:p-1">
            <p className="text-[12px] leading-[26px] font-medium uppercase tracking-[0.24em] text-[#68798A]">Rider arrival</p>
            <p className="text-[14px] leading-[26px] font-semibold text-[#114CCC]">{order.riderArrivalTime || 0} mins away</p>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#114CCC]" style={{ width: `${riderProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Order details */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-1">
          <div className="border border-slate-200 bg-white p-0 shadow-sm">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-1 items-center">
              {/* Order item image and title */}
              <div className="flex items-center gap-4 py-4 md:py-2 px-4 md:px-2">
                <div className="h-24 w-24 overflow-hidden rounded-[28px] bg-slate-100">
                  {typeof primaryItem?.imageUrl === "string" && primaryItem.imageUrl ? (
                    <Image
                      src={primaryItem.imageUrl}
                      alt={String(primaryItem.name || "Order item")}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">Item</div>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-[20px] leading-[26px] font-semibold text-[#031927] truncate">{String(primaryItem?.name || "Order item")}</h2>
                  <p className="text-[16px] leading-[26px] text-[#68798A] truncate">Quantity: <span className="font-bold">{String(primaryItem?.quantity ?? "0")}</span>
                  </p>
                  <p className="text-[20px] leading-[26px] font-bold text-[#031927]">₦{totalPrice.toLocaleString()}</p>
                </div>
              </div>
              
              {/* Customer data - add customer name, phone and photo */}
              {/* <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{order.customer?.name || "Customer name not available"}</p>
                <p className="mt-1 text-sm text-slate-500">{order.customer?.phone || "Not Available"}</p>
                <p className="mt-1 text-sm text-slate-500">{order.customer?.address || "Customer address not available"}</p>
                <p className="mt-2 text-sm text-slate-500">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
              </div> */}

              {/* Customer details */}
              <div className="hidden md:block rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Customer</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{order.customer?.name || "Customer name not available"}</p>
                  </div>
                  <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Customer</div>
                </div>
                <div className="mt-6 space-y-4 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Phone</p>
                    <p className="mt-1 text-base text-slate-900">{String(order.customer?.phone ?? "N/A")}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delivery address</p>
                    <p className="mt-1 text-base text-slate-900">{String(order.customer?.address || "N/A")}</p>
                    <p className="mt-1 text-sm text-slate-500">{String(order.customer?.city || "")}{order.customer?.city && order.customer?.state ? ", " : ""}{String(order.customer?.state || "")}</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4">
              {/* {primaryItem?.customerPreference ? ( */}
                <p className="mt-3 text-sm font-medium text-slate-700">Preference: <span className="font-semibold text-slate-900">{String(primaryItem.customerPreference)}</span></p>
              {/* ) : null} */}
            </div>

            <div className="mt-6 grid grid-cols-3 md:grid-cols-1 gap-4">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Created</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formattedOrderDate}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Order ID</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">#{order.id}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:hidden block">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Customer</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{order.customer?.name || "Unknown"}</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Customer</div>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Phone</p>
                  <p className="mt-1 text-base text-slate-900">{String(order.customer?.phone ?? "N/A")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Delivery address</p>
                  <p className="mt-1 text-base text-slate-900">{String(order.customer?.address || "N/A")}</p>
                  <p className="mt-1 text-sm text-slate-500">{String(order.customer?.city || "")}{order.customer?.city && order.customer?.state ? ", " : ""}{String(order.customer?.state || "")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Order timeline</p>
                  <p className="mt-2 text-sm text-slate-700">Track order progress from receipt to delivery.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex || currentStepIndex === -1 && step.id === "pending";
                  const isActive = index === currentStepIndex;
                  const isFuture = index > currentStepIndex;
                  const stepTime = getStepTime(step.id);

                  return (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                            isCompleted
                              ? "border-blue-500 bg-blue-500 text-white"
                              : isActive
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-slate-300 bg-white text-slate-500",
                          )}
                        >
                          {isCompleted || isActive ? "✓" : index + 1}
                        </div>
                        {index < timelineSteps.length - 1 ? (
                          <div className={cn(
                            "mt-1 h-full w-px",
                            isCompleted ? "bg-blue-500" : "bg-slate-200",
                          )} />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm font-semibold",
                          isCompleted || isActive ? "text-slate-900" : "text-slate-500",
                        )}>
                          {step.label}
                        </p>
                        {stepTime ? (
                          <p className="mt-1 text-xs text-slate-500">{stepTime}</p>
                        ) : null}
                        {isActive ? (
                          <p className="mt-1 text-xs text-orange-600">In progress</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-1">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Order items</p>
                <p className="mt-1 text-sm text-slate-700">{itemCount} item{itemCount === 1 ? "" : "s"} in this order</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Summary</span>
            </div>

            <div className="mt-5 space-y-3">
              {orderItems.map((item: any, index: number) => (
                <div key={String(item?.id ?? index)} className="grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white">
                      {String(item?.imageUrl || "") ? (
                        <Image
                          src={String(item.imageUrl)}
                          alt={String(item?.name || "Item image")}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">No image</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950 truncate">{String(item?.name || "Item")}</p>
                      <p className="mt-1 text-xs text-slate-500 truncate">Qty {String(item?.quantity || 1)}{String(item?.optionLabel || "") ? ` · ${String(item.optionLabel)}` : ""}</p>
                      {String(item?.customerPreference || "") ? (
                        <p className="mt-2 text-xs text-slate-500">Preference: {String(item.customerPreference)}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">₦{Number(item?.price || 0).toLocaleString()}</p>
                    {/* <p className="mt-2 text-xs text-slate-500">Line total</p> */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Verification</p>
            <p className="mt-2 text-sm text-slate-700">Capture meal verification after packing.</p>
            <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
              <Camera className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              <p className="font-semibold text-slate-900">Meal photo verification</p>
              <p className="mt-2">No photo uploaded yet.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Ready to take action?</p>
            <p className="mt-1 max-w-2xl text-sm text-slate-700">Update order status and keep the progress timeline in sync.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="rounded-full px-5 py-3">
                <PhoneCall className="w-4 h-4 mr-2" />
                Call Rider
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full px-5 py-3 flex items-center justify-center gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                    More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleStatusChange(OrderStatus.PROCESSING)}>
                    Mark as Preparing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(OrderStatus.READY)}>
                    Mark as Ready for Pickup
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(OrderStatus.ONTRANSIT)}>
                    Mark as Picked Up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(OrderStatus.COMPLETED)}>
                    Mark as Delivered
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(OrderStatus.CANCELLED)}>
                    Cancel Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              className="rounded-full px-5 py-3 bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => handleStatusChange(OrderStatus.READY)}
              disabled={updateLoading}
            >
              {updateLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              {updateLoading ? "Updating..." : "Mark as Ready for Pickup"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

        