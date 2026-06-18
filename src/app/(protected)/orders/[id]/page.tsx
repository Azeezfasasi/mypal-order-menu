"use client";

import React, { useState } from "react";
import { useOrderById, useUpdateOrderStatus, useNotifyCustomer } from "@/hooks/use-orders";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Phone, MapPin, Camera, PhoneCall, ChevronRight, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleMarkAsReady = async () => {
    try {
      await updateStatus(orderId, "READY");
      // Refresh or show success message
      alert("Order marked as ready!");
    } catch (err) {
      alert("Failed to update order status");
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

  const statusColors = {
    Preparing: "bg-orange-50 text-orange-700 border-orange-200",
    Ready: "bg-green-50 text-green-700 border-green-200",
    Pending: "bg-gray-50 text-gray-700 border-gray-200",
    "Picked Up": "bg-blue-50 text-blue-700 border-blue-200",
    Delivered: "bg-green-50 text-green-700 border-green-200",
  };

  if (!order) {
    return null; // Should not reach here due to loading state
  }

  return (
    <div className="space-y-6 bg-linear-to-r from-[#B2D5FF]/10 to-blue-[#B2D5FF]/10 px-0">
        {/* Header */}
        <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-3 text-[24px] font-extrabold leading-6.5 text-[#031927]">
                <button onClick={() => router.back()} className="text-gray-600">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Order Details</h1>
                </div>
            </div>
        </div>

        {/* Order Title and Status */}
        <div className="flex items-center justify-start gap-2">
            <h1 className="text-[16px] font-semibold leading-6.5 text-[#68798A]">Order <span className="text-[#363C44]">#{order.orderNumber}</span></h1>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status as keyof typeof statusColors]}`}>
                {order.status}
            </span>
        </div>

      {/* Order Info */}

      {/* Time Info */}
      <div className="grid grid-cols-2 gap-3 p-0 rounded-lg">
        <div>
          <div className="text-[14px] font-medium leading-6.5 text-[#68798A]">Prep Time</div>
          <div className="text-[14px] font-semibold leading-6.5 text-[#DB3A07]">{order.prepTime || 0} mins left</div>
        </div>
        <div>
          <div className="text-[14px] font-medium leading-6.5 text-[#68798A]">Rider Arrival</div>
          <div className="text-[14px] font-semibold leading-6.5 text-blue-600">{order.riderArrivalTime || 0} mins away</div>
        </div>
      </div>

      {/* Order Items */}
      {order.items && order.items.length > 0 ? (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex gap-3 mb-3">
          <Image
            width={80}
            height={80}
            src="/images/rice.svg"
            alt={String(order.items[0]?.name || 'Order item')}
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-[20px] leading-6.5 text-[#031927]">{order.items[0]?.name}</h3>
            <p className="text-[16px] font-semibold leading-6.5 text-[#68798A] mt-1">Quantity: <span className="text-[#031927]">{String(order.items[0]?.quantity || 0)}</span></p>
            <p className="text-[20px] font-bold leading-6.5 text-[#031927] mt-2">₦{String((order.totalPrice as number) || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
      ) : null}

      {/* Customer Info */}
      {order.customer ? (
      <div className="space-y-3">
        <h3 className="text-[16px] font-semibold leading-6.5 text-[#68798A]">Customer</h3>
        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">👤</div>
            <div>
              <p className="text-[20px] font-semibold leading-6.5 text-[#031927]">{order.customer.name}</p>
              <p className="text-[16px] font-semibold leading-6.5 text-[#68798A]">{String(order.customer.phone || 'N/A')}</p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2 pt-2 border-t">
            <MapPin className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm">{order.customer.address}</p>
              <p className="text-xs text-gray-600">{String(order.customer.city || '')}, {String(order.customer.state || '')}</p>
            </div>
            <Link href="#" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
            View on map <ChevronRight className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
      ) : null}

      {/* Customer Preference */}
      {order.items && order.items[0]?.customerPreference ? (
        <div className="bg-[#FEF8E1] rounded-[10px] p-4">
          <h3 className="font-semibold text-[14.72px] text-[#8E4E09] leading-[30.95px]">Customer Preference</h3>
          <p className="font-medium text-[12.72px] text-[#1A1D21] leading-[30.95px]">{String(order.items[0]?.customerPreference || '')}</p>
        </div>
      ) : null}

      {/* Order Timeline */}
      {order.timeline && order.timeline.length > 0 ? (
      <div className="space-y-3">
        <h3 className="font-bold">Order Timeline</h3>
        <div className="space-y-4">
          {order.timeline.map((event, index) => (
            <div key={String(event.id)} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  event.isCurrentStatus ? "bg-blue-600" : "bg-gray-400"
                }`}>
                  {event.isCurrentStatus ? "⊙" : "●"}
                </div>
                {index < order.timeline!.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{event.status}</p>
                <p className={`text-xs ${event.isCurrentStatus ? "text-blue-600 font-medium" : "text-gray-600"}`}>
                  {event.isCurrentStatus ? "In Progress" : event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {/* Remaining steps */}
          {order.timeline.length < 4 && (
            <>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-gray-300">
                    ○
                  </div>
                  <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-500">Ready for Pickup</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-gray-300">
                    ○
                  </div>
                  <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-500">Picked Up</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-gray-300">
                    ○
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-500">Delivered</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      ) : null}

      {/* Meal Verification */}
      <div className="space-y-3">
        <h3 className="font-bold">Meal Verification</h3>
        <p className="text-xs text-gray-600">Send meal confirmation to customer before dispatch.</p>

        {!mealPhoto ? (
            <>
          <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
            <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-2">Snap Meal Photo</p>
            <p className="text-xs text-gray-600 mb-4">Take a quick photo of the completed order before dispatch.</p>
          </div>
          <div className="flex gap-2">
              <Button className="flex-1 bg-white text-orange-600 border border-orange-600 hover:bg-orange-50">
                <Camera className="w-4 h-4 mr-2" />
                Open Camera
              </Button>
              <Button className="flex-1 bg-orange-600 text-white hover:bg-orange-700">
                <span>📁</span>
                <span className="ml-2">Upload Image</span>
              </Button>
          </div>
          </>
        ) : (
          <div className="space-y-3">
            <Image 
              width={300}
              height={300}
              src={mealPhoto} 
              alt="Meal" 
              className="w-full rounded-lg" 
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleNotifyCustomer}
                disabled={notifyLoading}
                className="flex-1 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {notifyLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                {notifyLoading ? "Sending..." : "Send to customer"}
              </Button>
              <Button 
                onClick={() => setMealPhoto(null)}
                className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setMealPhoto(null)}
                className="flex-1 bg-white text-orange-600 border border-orange-600 hover:bg-orange-50"
              >
                Retake
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="space-y-2 pb-4 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-2 w-full">
          <Button className="flex-1 bg-green-100 text-green-700 hover:bg-green-200">
            <PhoneCall className="w-4 h-4 mr-2" />
            Call Rider
          </Button>
          <Button className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
            ⋮ More Actions
          </Button>
        </div>
        <Button 
          onClick={handleMarkAsReady}
          disabled={updateLoading}
          className="w-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {updateLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
          {updateLoading ? "Updating..." : "Mark as Ready for Pickup"}
        </Button>
      </div>
    </div>
  );
}
