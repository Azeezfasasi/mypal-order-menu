import { EventClass, EventType } from "@/types/enums";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Step, UseStepNavigationReturn } from "../types";

export const useStepNavigation = (
  eventType: EventType,
  eventClass: EventClass,
  initialStep: Step = "basic",
): UseStepNavigationReturn => {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);

  const availableSteps = useMemo((): Step[] => {
    const steps: Step[] = ["basic", "datetime"];

    // Ticket step is based on event type only
    if (eventType === EventType.TICKET) {
      steps.push("tickets");
    }

    // Additional step is based on event class only
    if (eventClass === EventClass.EXCLUSIVE) {
      steps.push("additional");
    }

    console.log("🔄 Recalculating available steps:", {
      eventType,
      eventClass,
      steps,
    });

    return steps;
  }, [eventType, eventClass]); // ✅ Now it will recalculate when these change

  // Auto-adjust current step if it's no longer available
  // (e.g., user was on "additional" step but changed from EXCLUSIVE to REGULAR)
  useEffect(() => {
    if (!availableSteps.includes(currentStep)) {
      console.log(
        `⚠️ Current step "${currentStep}" is no longer available. Resetting to last valid step`,
      );
      const lastValidStep = availableSteps[availableSteps.length - 1];
      setCurrentStep(lastValidStep);
    }
  }, [availableSteps, currentStep]);

  const getStepIndex = useCallback(
    (step?: Step) => {
      const targetStep = step || currentStep;
      return availableSteps.indexOf(targetStep);
    },
    [availableSteps, currentStep],
  );

  const isFirstStep = useMemo(() => getStepIndex() === 0, [getStepIndex]);

  const isLastStep = useMemo(
    () => getStepIndex() === availableSteps.length - 1,
    [getStepIndex, availableSteps.length],
  );

  const getProgress = useCallback(
    () => ((getStepIndex() + 1) / availableSteps.length) * 100,
    [getStepIndex, availableSteps.length],
  );

  const nextStep = useCallback(() => {
    const currentIndex = getStepIndex();
    if (currentIndex < availableSteps.length - 1) {
      const next = availableSteps[currentIndex + 1];
      console.log("🚶 Moving to next step:", next);
      setCurrentStep(next);
    }
  }, [getStepIndex, availableSteps]);

  const previousStep = useCallback(() => {
    const currentIndex = getStepIndex();
    if (currentIndex > 0) {
      const previous = availableSteps[currentIndex - 1];
      console.log("🚶 Moving to previous step:", previous);
      setCurrentStep(previous);
    }
  }, [getStepIndex, availableSteps]);

  const goToStep = useCallback(
    (step: Step) => {
      if (availableSteps.includes(step)) {
        setCurrentStep(step);
      }
    },
    [availableSteps],
  );

  return {
    currentStep,
    availableSteps,
    nextStep,
    previousStep,
    goToStep,
    isFirstStep,
    isLastStep,
    getStepIndex,
    getProgress,
  };
};
