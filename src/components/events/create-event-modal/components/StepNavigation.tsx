"use client";

import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

export const StepNavigation = ({
  onPrevious,
  // onNext,
  isFirstStep,
  isLastStep,
  isSubmitting,
}: StepNavigationProps) => {
  return (
    <div className="flex flex-row sm:flex-col justify-between gap-4 sm:gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="w-[50%] text-gray-700 border border-[#D0D5DD] hover:border-[#D0D5DD] focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 order-1 sm:order-2 sm:w-full py-6"
      >
        Previous
      </Button>
      {isLastStep ? (
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 order-2 sm:order-1 w-[50%] sm:w-full py-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      ) : (
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 order-2 sm:order-1 w-[50%] sm:w-full py-6"
          disabled={isSubmitting}
        >
          Proceed
        </Button>
      )}
    </div>
  );
};
