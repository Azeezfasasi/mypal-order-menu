"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { BusinessCategoryType } from "@/types/enums";
import type { Order } from "@/types/overview";
import { DialogTitle } from "@radix-ui/react-dialog";
import { formatDate } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
}: OrderDetailsModalProps) {

  // --- to get the business category ---
  const business = useAuthStore((state) => state.business);
  const [selectedBusinessType,] = useState(
    business?.category?.business_type,
  );

  if (!order) return null;

  const details = order.details;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[95dvh] overflow-auto [&>button]:hidden">
        <DialogTitle className="hidden"></DialogTitle>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Order details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Customer&apos;s name</span>
            <span className="font-medium">
              {order.user.firstname} {order.user.lastname}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Order ID</span>
            <span className="font-medium">{order.id}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Date of order</span>
            <span className="font-medium">
              {formatDate(order.createdAt, "dd MMM yyyy, HH:mm")}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Cost of item</span>
            <span className="f(ont-medium">
              {formatCurrency(details?.amount) ?? formatCurrency(order.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Order status</span>
            <span className="font-medium capitalize">{order.status}</span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Order method</span>
            <span className="font-medium">
              {order.order_method ?? details?.order_method ?? "Self pick-up"}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Delivery service</span>
            <span className="font-medium">
              {String(order.delivery ?? details?.delivery_service ?? "")}
            </span>
          </div>

          {selectedBusinessType === BusinessCategoryType?.ICONICDELICACIES &&
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Delivery Pickup OTP</span>
              <span className="font-medium">
                {String(details?.delivery?.pickup_otp ?? "- -")}
              </span>
            </div>
          }
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1">
            Delete
          </Button>
          <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
