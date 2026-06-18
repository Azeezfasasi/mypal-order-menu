import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  FinediningCuisine,
  FinediningCuisineApi,
} from "@/services/finedining-cuisine-api";
import { ChefHat, Plus } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CuisineCard from "./CuisineCard";
import CuisineSelectionModal from "./CuisineSelectionModal";

// Main Component
export default function FineDiningCuisineManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: cuisinesData,
    isLoading: cuisinesLoading,
    error: cuisinesError,
  } = FinediningCuisineApi.useGetBusinessCuisines();

  // Normalize API response: the backend may return either a single cuisine object
  // or an array of selected cuisine categories. We normalize to an array of cuisines.
  const rawCuisine = cuisinesData?.data;

  const selectedCuisines: FinediningCuisine[] = Array.isArray(rawCuisine)
    ? rawCuisine
    : rawCuisine && typeof rawCuisine === "object"
      ? [rawCuisine]
      : [];

  const hasCuisine = selectedCuisines.length > 0;

  const currentCuisine = hasCuisine ? selectedCuisines[0] : null;

  const selectedCategoryIdsFromServer = selectedCuisines.map((c) => c.id);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const { mutate: removeCategories } =
    FinediningCuisineApi.useRemoveCuisineCategory();

  const handleRemoveFromCard = (id: string) => {
    // Call remove mutation with single id - API now expects cuisine_category_id (singular)
    removeCategories(
      { cuisine_category_id: id },
      {
        onSuccess: async () => {
          // Refetch the business cuisines query to ensure UI is updated
          await queryClient.refetchQueries({
            queryKey: ["finedining-cuisines"],
          });
        },
      },
    );
  };

  if (cuisinesError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">Error loading cuisines</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <Card className="mx-auto">
        {/* Header */}
        <CardHeader className="flex-row items-center justify-between mb-4">
          <div>
            <h3 className="text-xl md:text-md font-bold font-sora flex items-center gap-3 text-primary-500">
              Cuisine Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {hasCuisine
                ? "Manage your business cuisine type(s)"
                : "Select a cuisine type for your business"}
            </p>
          </div>

          <Button
            onClick={handleOpenModal}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            {hasCuisine ? "Update Cuisine" : "Select Cuisine"}
          </Button>
        </CardHeader>

        {/* Cuisine Display */}
        <CardContent>
          {cuisinesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : hasCuisine ? (
            <div className="space-y-3">
              {selectedCuisines.map((c) => (
                <CuisineCard
                  key={c.id}
                  cuisine={c}
                  onRemove={handleRemoveFromCard}
                  showDetailedView={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No cuisine selected
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a cuisine type to get started with your menu
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CuisineSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        currentCuisine={currentCuisine}
        selectedCategoryIdsFromServer={selectedCategoryIdsFromServer}
      />
    </>
  );
}
