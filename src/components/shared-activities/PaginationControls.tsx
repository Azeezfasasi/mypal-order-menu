// PaginationControls.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  setCurrentPage?: (page: number) => void;
  itemName: string;
  isLoading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  itemName,
  isLoading = false,
}: PaginationControlsProps) {
  const disableButtons = isLoading;

  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={prevPage}
          disabled={currentPage === 1 || disableButtons}
          aria-label={`Go to previous page of ${itemName}s`}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={nextPage}
          disabled={currentPage === totalPages || disableButtons}
          aria-label={`Go to next page of ${itemName}s`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>
    </div>
  );
}
