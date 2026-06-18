"use client";

import { Button } from "@/components/ui/button";

interface EditStepNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

export const EditStepNavigation = ({
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
  isSubmitting,
}: EditStepNavigationProps) => {
  return (
    <div className="flex flex-row sm:flex-col justify-between gap-0 sm:gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="order-1 sm:order-2 w-auto sm:w-full"
      >
        Previous
      </Button>
      <Button
        type="submit"
        className="bg-orange-600 hover:bg-orange-700 order-2 sm:order-1 w-auto sm:w-full"
        disabled={isSubmitting}
        onClick={onNext}
      >
        {isLastStep ? (isSubmitting ? "Updating..." : "Update Event") : "Next"}
      </Button>
    </div>
  );
};
