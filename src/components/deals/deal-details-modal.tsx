"use client";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DealsApi } from "@/services/api/deals-api";
import { IDeal, IDealListItem } from "@/types/deal-types";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Gift,
  Hourglass,
  ImageIcon,
  MapPin,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Separator } from "../ui/separator";

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: IDeal | IDealListItem | null;
  onDelete?: (dealId: string) => void;
  showDeleteButton?: boolean;
}

export default function DealDetailsModal({
  isOpen,
  onClose,
  deal,
  onDelete,
  showDeleteButton = false,
}: DealDetailsModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutate: deleteDeal, isPending: isDeleting } =
    DealsApi.useDeleteDeal();

  if (!deal) return null;

  const getStatusBadge = (status: boolean) => {
    return status
      ? "bg-green-600 text-white hover:bg-green-700"
      : "bg-yellow-600 text-white hover:bg-yellow-700";
  };

  const handleDelete = () => {
    deleteDeal(deal.id, {
      onSuccess: () => {
        onClose();
        if (onDelete) {
          onDelete(deal.id);
        }
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[95vh] md:max-h-[90svh] flex flex-col p-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-lg font-medium">
              Deal details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-orange-600">
              {deal.deal_title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadge(deal.is_approved)}>
                {deal.is_approved ? "Approved" : "Pending"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">
              <Tag className="h-3 w-3 mr-1" />
              Deal
            </Badge>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
              {formatCurrency(deal.price)}
            </Badge>
            {deal.is_eighteen_plus && (
              <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                18+
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-md text-gray-900 mb-3">
              About This Deal
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {deal.about_deal}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{deal.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Deal Dates</p>
                <p className="font-medium">
                  {formatDate(deal.start_date)}
                  {deal.end_date !== deal.start_date &&
                    ` - ${formatDate(deal.end_date)}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">
                  {deal.start_time} - {deal.end_time}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Hourglass className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{deal.duration}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Adult content (18+)</p>
                <p className="font-medium">
                  {deal.is_eighteen_plus ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date Created</p>
                <p className="font-medium">{formatDate(deal.createdAt)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deal Image */}
          {deal.flyer_url && (
            <div className="space-y-4">
              <h3 className="font-medium text-md text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-600" /> Deal Image
              </h3>
              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={
                    typeof deal.flyer_url === "string"
                      ? deal.flyer_url
                      : URL.createObjectURL(deal.flyer_url as unknown as Blob)
                  }
                  alt={deal.deal_title}
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Deal Benefits Section */}
          {deal.benefits?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-md text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" /> Deal Benefits
              </h3>
              <div className="grid gap-2">
                {deal.benefits.map((benefit) => (
                  <div key={benefit.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deal Agenda Section */}
          {deal.agendas?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-md text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" /> Deal Agenda
              </h3>
              <div className="space-y-2">
                {deal.agendas.map((agenda) => (
                  <div key={agenda.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{agenda.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-6 pt-4 border-t">
          <div className="flex items-center gap-2 w-full">
            {showDeleteButton && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Deal"}
              </Button>
            )}
            <Button
              className={`${
                showDeleteButton ? "flex-1" : "w-full"
              } bg-orange-600 hover:bg-orange-700 text-white`}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Confirm Delete Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Deal"
          description="Are you sure you want to delete this deal? This action cannot be undone."
          confirmText="Delete"
        />
      </DialogContent>
    </Dialog>
  );
}
