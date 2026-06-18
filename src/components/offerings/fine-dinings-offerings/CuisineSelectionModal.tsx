import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type FinediningCuisine,
  FinediningCuisineApi,
} from "@/services/finedining-cuisine-api";

import { ChefHat, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface CuisineSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCuisine?: FinediningCuisine | null;
  // new prop: list of already selected category ids from server
  selectedCategoryIdsFromServer?: string[];
}

export default function CuisineSelectionModal({
  isOpen,
  onClose,
  currentCuisine,
  selectedCategoryIdsFromServer,
}: CuisineSelectionModalProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: categoriesData } =
    FinediningCuisineApi.useGetCuisineCategories();

  const { mutate: selectCategory, isPending: selectingCategory } =
    FinediningCuisineApi.useSelectCuisineCategory();

  const { mutate: removeCategories, isPending: removingCategories } =
    FinediningCuisineApi.useRemoveCuisineCategory();

  const categories = useMemo(
    () => categoriesData?.data || [],
    [categoriesData],
  );

  const handleToggle = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Pre-select current cuisine category(s) when modal opens.
  // Prefer server-provided selected ids (selectedCategoryIdsFromServer) when available.
  useEffect(() => {
    if (!isOpen) return;

    if (categories.length === 0) {
      setSelectedCategoryIds([]);
      return;
    }

    if (
      selectedCategoryIdsFromServer &&
      selectedCategoryIdsFromServer.length > 0
    ) {
      setSelectedCategoryIds(selectedCategoryIdsFromServer);
      return;
    }

    if (currentCuisine) {
      const currentCategory = categories.find(
        (cat) => cat.name === currentCuisine.name,
      );
      if (currentCategory) {
        setSelectedCategoryIds([currentCategory.id]);
      } else {
        setSelectedCategoryIds([]);
      }
    } else {
      setSelectedCategoryIds([]);
    }
  }, [isOpen, currentCuisine, categories, selectedCategoryIdsFromServer]);

  const handleSubmit = () => {
    if (selectedCategoryIds.length > 0) {
      selectCategory(
        { cuisine_category_ids: selectedCategoryIds },
        {
          onSuccess: async () => {
            // Ensure the query is refetched with latest data
            await queryClient.refetchQueries({
              queryKey: ["finedining-cuisines"],
            });
            onClose();
            setSelectedCategoryIds([]);
          },
        },
      );
    }
  };

  const handleRemove = () => {
    if (!selectedCategoryIdsFromServer || selectedCategoryIdsFromServer.length === 0) return;
    
    // Calculate which items were removed (unchecked)
    const itemsToRemove = selectedCategoryIdsFromServer.filter(
      (id) => !selectedCategoryIds.includes(id)
    );
    
    // If user unchecked items, remove them
    if (itemsToRemove.length > 0) {
      // Remove each item - the API service will handle invalidation on each success
      const removeNext = (index: number) => {
        if (index >= itemsToRemove.length) {
          // All items removed successfully
          onClose();
          setSelectedCategoryIds([]);
          return;
        }
        
        removeCategories(
          { cuisine_category_id: itemsToRemove[index] },
          {
            onSuccess: async () => {
              // Continue to next item
              await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay between requests
              removeNext(index + 1);
            },
            onError: () => {
              // On error, stop the removal process
              return;
            },
          },
        );
      };
      
      removeNext(0);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCategoryIds([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {currentCuisine ? "Update Cuisine" : "Select Cuisine"}
          </DialogTitle>
          <DialogDescription>
            {currentCuisine
              ? `Update your cuisine type. Currently: ${currentCuisine.name}`
              : "Choose a cuisine type for your business. You can select multiple types."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Selected chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCategoryIds.length === 0 ? (
              <span className="text-sm text-gray-500">
                No categories selected
              </span>
            ) : (
              selectedCategoryIds.map((id) => {
                const cat = categories.find((c) => c.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-2 bg-gray-100 text-sm px-2 py-1 rounded-full"
                  >
                    <span>{cat?.name ?? id}</span>
                    <button
                      type="button"
                      onClick={() => handleToggle(id)}
                      className="text-xs text-red-600 ml-1"
                      aria-label={`Remove ${cat?.name ?? "category"}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>

          {/* Multi-select checkbox list (scrollable) */}
          <div className="grid gap-2 max-h-64 overflow-auto">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 p-2 border rounded-md"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={() => {
                    handleToggle(category.id);
                  }}
                  disabled={selectingCategory || removingCategories}
                  className="h-4 w-4"
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={selectingCategory || removingCategories}
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={
              !selectedCategoryIdsFromServer ||
              selectedCategoryIdsFromServer.length === 0 ||
              (selectedCategoryIds.length === selectedCategoryIdsFromServer.length && 
               selectedCategoryIdsFromServer.every(id => selectedCategoryIds.includes(id))) ||
              removingCategories
            }
            className="text-red-600 border-red-200"
          >
            {removingCategories ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Remove
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={selectedCategoryIds.length === 0 || selectingCategory}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {selectingCategory && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {selectingCategory
              ? "Updating..."
              : currentCuisine
                ? "Update Cuisine"
                : "Select Cuisine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
