// components/accommodation/AccommodationList.tsx
"use client";

import Loader from "@/components/shared/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AccommodationAttractionApi } from "@/services/api/accomodation-attraction-api";
import { IAccommodation } from "@/types/accomodation-attraction-types";
import { PromotionsApi, type PromotionType, type TimeRemaining } from "@/services/api/promotions-api";
import { AlertCircle, Plus } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import PromoteItemModal from "@/components/PromoteBusiness";
import AccommodationDialog from "./AccommodationDialog";

interface PromotionWithAccommodation {
  accommodation?: {
    id: string;
  };
}

export default function AccommodationList({
  sectionTitle,
}: {
  sectionTitle?: string;
}) {
  const [page, setPage] = useState(1); // zero-based
  const limit = 10;

  const {
    data: accommodationsResponse,
    isLoading: loadingAccommodations,
    error: accommodationsError,
  } = AccommodationAttractionApi.useBusinessAccommodations(page, limit);

  const deleteAccommodationMutation =
    AccommodationAttractionApi.useDeleteAccommodation();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentAccommodation, setCurrentAccommodation] =
    useState<IAccommodation | null>(null);
  const [promoteModalState, setPromoteModalState] = useState<{
    isOpen: boolean;
    accommodationId: string;
    promotionType?: PromotionType;
  }>({
    isOpen: false,
    accommodationId: "",
  });

  // Fetch promotions to check promoted status
  const { data: promotionsResponse } = PromotionsApi.useListPromotions();
  const promotedAccommodationData = useMemo(() => {
    if (!promotionsResponse?.data) return new Map<string, TimeRemaining>();
    const map = new Map<string, TimeRemaining>();
    promotionsResponse.data
      .filter((p) => p.status?.toLowerCase() === "active")
      .forEach((p) => {
        // Handle accommodation promotions
        if (p.promotion_type === "accommodation") {
          const accommodation = (p as PromotionWithAccommodation).accommodation;
          if (accommodation?.id && p.time_remaining) {
            map.set(accommodation.id, p.time_remaining);
          }
        }
      });
    return map;
  }, [promotionsResponse?.data]);

  const formatTimeRemaining = (timeRemaining: TimeRemaining): string => {
    const { days = 0, hours = 0, minutes = 0 } = timeRemaining;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  };

  const accommodations = accommodationsResponse?.data.data || [];
  const totalPages = accommodationsResponse?.data.totalPages || 1;

  const handleDeleteAccommodation = async (id: string) => {
    if (confirm("Are you sure you want to delete this accommodation?")) {
      try {
        await deleteAccommodationMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete accommodation:", error);
      }
    }
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setCurrentAccommodation(null);
  };

  if (loadingAccommodations) {
    return (
      <Card className="flex justify-center items-center py-8">
        <Loader message="Loading accommodations..." />
      </Card>
    );
  }

  if (accommodationsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load accommodations. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 md:flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-primary">
            {sectionTitle || "Accommodations"}
          </h2>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {accommodations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No accommodations found. Add your first accommodation to get
            started.
          </div>
        ) : (
          <div className="space-y-4">
            {accommodations.map((accommodation) => (
              <div
                key={accommodation.id}
                className="flex flex-col p-4 bg-gray-50 rounded-md"
              >
                <div className="flex 2xl:flex-row xl:flex-row lg:flex-row md:flex-col flex-col 2xl:items-center xl:items-center lg:items-center gap-4">
                  {accommodation.images && accommodation.images[0] && (
                    <Image
                      src={accommodation.images[0]}
                      alt={accommodation.apartment_name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover w-20 h-20"
                    />
                  )}
                  <div className="flex-1 text-sm">
                    <span className="font-semibold text-base block">
                      {accommodation.apartment_name}
                    </span>
                    <span className="text-gray-500 block">
                      Category: {accommodation.category?.name || "N/A"} • Total
                      units: {accommodation.total_units || "N/A"}
                    </span>
                    <span className="text-gray-700 font-medium block">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold">
                          {formatCurrency(
                            accommodation.pricing?.basePricePerNight || 0,
                          )} <span className="text-xs text-gray-500">/night</span>
                        </span>
                        {accommodation.pricing?.discounts &&
                        accommodation.pricing.discounts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {accommodation.pricing.discounts.map((discount, idx) => (
                              <Badge
                                key={idx}
                                className="bg-green-100 text-green-700 border-green-200 text-xs px-2"
                                variant="outline"
                              >
                                {discount.percentage}% off {discount.minNights} nights
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </span>
                    {accommodation.attractions &&
                      accommodation.attractions?.length > 0 && (
                        <span className="text-xs text-blue-600 block">
                          {accommodations.length} attraction(s)
                        </span>
                      )}
                  </div>
                  <div className="flex gap-2 self-start 2xl:self-auto xl:self-auto lg:self-auto flex-wrap">
                    {promotedAccommodationData.has(accommodation.id) ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          disabled
                          className="text-xs font-medium bg-white text-green-600 border-green-600 cursor-default"
                        >
                          Promoted
                        </Button>
                        <Badge
                          variant="soft-default"
                          className="bg-green-100 text-green-700 border-green-200 text-xs"
                        >
                          {formatTimeRemaining(
                            promotedAccommodationData.get(accommodation.id)!,
                          )}{" "}
                          remaining
                        </Badge>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="text-xs font-medium text-orange-600 border-orange-600 hover:bg-orange-50"
                        onClick={() => {
                          setPromoteModalState({
                            isOpen: true,
                            accommodationId: accommodation.id,
                            promotionType: "accommodation",
                          });
                        }}
                      >
                        Promote
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="text-xs font-medium text-blue-600 border-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setCurrentAccommodation(accommodation);
                        setShowEditDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-gray-700"
                      onClick={() =>
                        handleDeleteAccommodation(accommodation.id)
                      }
                      disabled={deleteAccommodationMutation.isPending}
                    >
                      {deleteAccommodationMutation.isPending
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <span className="px-4 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      <AccommodationDialog
        isOpen={showAddDialog}
        onClose={handleCloseAddDialog}
        mode="create"
      />

      <AccommodationDialog
        isOpen={showEditDialog}
        onClose={handleCloseEditDialog}
        accommodation={currentAccommodation}
        mode="edit"
      />

      {/* Promote Accommodation Modal */}
      {promoteModalState.isOpen && (
        <PromoteItemModal
          isOpen={promoteModalState.isOpen}
          onClose={() =>
            setPromoteModalState({ isOpen: false, accommodationId: "" })
          }
          itemId={promoteModalState.accommodationId}
          promotionType={promoteModalState.promotionType || "accommodation"}
        />
      )}
    </>
  );
}
