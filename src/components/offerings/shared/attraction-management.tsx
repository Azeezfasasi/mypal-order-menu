"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiltersApi, type FilterCategory } from "@/services/api/filters-api";
import { toast } from "sonner";
import { BusinessContextDiagnostics } from "@/components/BusinessContextDiagnostics";

export default function AttractionsManagement({
  sectionTitle,
}: {
  sectionTitle?: string;
}) {
  const {
    data: availableFiltersResponse,
    isLoading: isAvailableLoading,
    error: availableError,
  } = FiltersApi.useGetAvailableFilters();

  const {
    data: businessFiltersResponse,
    isLoading: isBusinessFiltersLoading,
    error: businessFiltersError,
  } = FiltersApi.useGetBusinessFilters();

  const replaceFiltersMutation = FiltersApi.useReplaceBusinessFilters();

  const [availableCategories, setAvailableCategories] = useState<FilterCategory[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log("🎯 [ATTRACTIONS] Available filters response received:", {
      type: typeof availableFiltersResponse,
      isArray: Array.isArray(availableFiltersResponse),
      data: availableFiltersResponse,
    });
    if (Array.isArray(availableFiltersResponse)) {
      console.log("🎯 [ATTRACTIONS] Setting available categories:", {
        count: availableFiltersResponse.length,
        categories: availableFiltersResponse.map(c => ({ id: c.id, name: c.name, optionsCount: c.options?.length })),
      });
      setAvailableCategories(availableFiltersResponse);
    } else if (availableFiltersResponse && typeof availableFiltersResponse === 'object' && 'data' in availableFiltersResponse) {
      // Handle wrapped response (shouldn't happen but just in case)
      const data = (availableFiltersResponse as Record<string, unknown>).data;
      if (Array.isArray(data)) {
        console.log("🎯 [ATTRACTIONS] Unwrapping categories from response object");
        setAvailableCategories(data as FilterCategory[]);
      }
    } else {
      console.log("⚠️ [ATTRACTIONS] Unexpected response format:", availableFiltersResponse);
    }
  }, [availableFiltersResponse]);

  useEffect(() => {
    console.log("🎯 [ATTRACTIONS] Business filters response received:", {
      type: typeof businessFiltersResponse,
      isArray: Array.isArray(businessFiltersResponse),
      data: businessFiltersResponse,
    });
    if (Array.isArray(businessFiltersResponse)) {
      console.log("🎯 [ATTRACTIONS] Setting selected filters:", {
        count: businessFiltersResponse.length,
        filters: businessFiltersResponse.map(f => ({ id: f.id, label: f.label })),
      });
      setSelectedOptionIds(new Set(businessFiltersResponse.map((o) => o.id)));
    } else if (businessFiltersResponse && typeof businessFiltersResponse === 'object' && 'data' in businessFiltersResponse) {
      // Handle wrapped response (shouldn't happen but just in case)
      const data = (businessFiltersResponse as Record<string, unknown>).data;
      if (Array.isArray(data)) {
        console.log("🎯 [ATTRACTIONS] Unwrapping filters from response object");
        setSelectedOptionIds(new Set((data as unknown[]).map((o: unknown) => (o as { id: string }).id)));
      }
    } else {
      console.log("⚠️ [ATTRACTIONS] Unexpected business filters format:", businessFiltersResponse);
    }
  }, [businessFiltersResponse]);

  const toggleOption = (id: string) => {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    availableCategories.forEach((cat) => {
      cat.options.forEach((opt) => {
        allIds.add(opt.id);
      });
    });
    setSelectedOptionIds(allIds);
    toast.success("All filters selected");
  };

  const handleSave = async () => {
    setSaving(true);
    const ids = Array.from(selectedOptionIds);
    if (ids.length === 0) {
      // Confirm that user intends to remove all filters
      const sure = window.confirm(
        "You have not selected any filters. This will clear all existing filters. Continue?",
      );
      if (!sure) {
        setSaving(false);
        return;
      }
    }

    try {
      await replaceFiltersMutation.mutateAsync({ filter_option_ids: ids });
    } catch (err) {
      console.error("Failed to save filters:", err);
    } finally {
      setSaving(false);
    }
  };

  const isLoading = isAvailableLoading || isBusinessFiltersLoading;
  const hasErrors = !!availableError || !!businessFiltersError;

  return (
    <div className="space-y-6">
      {/* Show diagnostics if there are errors */}
      {hasErrors && <BusinessContextDiagnostics />}

      <Card className="p-6">
        <div className="flex md:flex-col md:gap-4 items-center justify-between mb-4">
          <h2 className="text-2xl font-sora font-semibold text-primary-600 md:text-lg">
            {sectionTitle || "Attractions & Filters"}
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Reset selection to current server state
                if (Array.isArray(businessFiltersResponse)) {
                  setSelectedOptionIds(new Set(businessFiltersResponse.map((o) => o.id)));
                  toast.success("Selections reset");
                }
              }}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
            >
              Select All
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-600">Loading filters...</div>
        ) : availableError || businessFiltersError ? (
          <div className="py-8 text-center">
            <div className="text-red-600 mb-3 font-medium">Unable to load filters</div>
            <p className="text-sm text-gray-600 mb-4">
              There was an issue retrieving your business filters. This may occur if:
              <br />
              • Your business doesn&apos;t have a category assigned in your profile
              <br />
              • Your authentication token has expired
              <br />
              • The backend cannot identify your business context
              <br />
              • No attractions are configured for your category
              <br />
              <br />
              Please check your business profile settings or try logging in again.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Error: {availableError?.message || businessFiltersError?.message || "Unknown error"}
            </p>
            <Button
              onClick={() => {
                // Force refresh to retry
                window.location.reload();
              }}
              variant="outline"
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {availableCategories.map((cat) => (
              <div key={cat.id} className="border rounded p-4">
                <h3 className="font-medium mb-3">{cat.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cat.options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedOptionIds.has(opt.id)}
                        onChange={() => toggleOption(opt.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {availableCategories.length === 0 && (
              <div className="text-center text-gray-500">No filters available for your business category.</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
