"use client";

import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiltersApi } from "@/services/api/filters-api";
import { useMemo } from "react";

export default function OccasionsSection() {
  // Fetch selected business filters which includes occasions
  const {
    data: businessFiltersResponse,
    isLoading: businessFiltersLoading,
    error: businessFiltersError,
  } = FiltersApi.useGetBusinessFilters();

  // Extract occasions from business filters
  const filteredOccasions = useMemo(() => {
    if (!Array.isArray(businessFiltersResponse)) return [];

    // Filter to only include items with Occasion category
    const occasions = businessFiltersResponse.filter((filter) => {
      const category = (filter as unknown as Record<string, unknown>).category;
      return (
        category &&
        typeof category === "object" &&
        ((category as unknown as Record<string, unknown>).slug === "occasion" ||
          (category as unknown as Record<string, unknown>).name === "Occasion")
      );
    });

    console.log("🎯 [OCCASIONS] Occasions fetched from business filters:", {
      totalFilters: businessFiltersResponse.length,
      occasionsCount: occasions.length,
      occasions: occasions.map((o) => ({
        id: (o as unknown as Record<string, unknown>).id,
        label: (o as unknown as Record<string, unknown>).label,
        icon: (o as unknown as Record<string, unknown>).icon,
      })),
    });

    return occasions;
  }, [businessFiltersResponse]);

  const isLoading = businessFiltersLoading;
  const hasErrors = !!businessFiltersError;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="py-6 px-6">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl text-primary-600 font-sora font-semibold md:text-lg">
              Occasions
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader message="Loading occasions..." />
            </div>
          ) : hasErrors ? (
            <div className="py-8">
              <ErrorHandler
                message={
                  businessFiltersError instanceof Error
                    ? businessFiltersError.message
                    : "Failed to load occasions"
                }
              />
            </div>
          ) : filteredOccasions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                No occasions available
              </p>
              <p className="text-gray-400 text-sm">
                No Occasion filters are currently selected
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
              {filteredOccasions.map((occasion) => {
                const filter = occasion as unknown as Record<string, unknown>;
                return (
                  <div
                    key={filter.id as string}
                    className="group bg-gradient-to-br from-white to-orange-50 border border-orange-100 rounded-lg p-5 hover:shadow-lg hover:border-orange-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg truncate flex-1 group-hover:text-orange-600 transition-colors">
                        {filter.label as string}
                      </h3>
                      <div className="text-2xl ml-2 flex-shrink-0">
                        {(filter.icon as string) || "✨"}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {(filter.group_label as string | null) || "Occasion"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
