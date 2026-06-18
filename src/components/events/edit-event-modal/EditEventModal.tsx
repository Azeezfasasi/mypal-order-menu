"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { EventClass, EventType } from "@/types/enums";
import { IEvent } from "@/types/event-types";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  AdditionalDetailsStep,
  DateTimeStep,
  StepIndicator,
  TicketsStep,
} from "../create-event-modal/components";
import { useStepErrors, useStepNavigation } from "../create-event-modal/hooks";
import { EventFormValues } from "../create-event-modal/types";
import {
  useFormHelpers,
  validateStepCanProceed,
} from "../create-event-modal/utils";
import { ErrorSummary } from "../error-summary";
import {
  EditBasicInformationStep,
  EditFormHeader,
  EditStepNavigation,
} from "./components";
import { useEditEventForm, useEditEventSubmission } from "./hooks";

// Inline type definition
interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: IEvent;
  onSuccess: () => void;
}

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  onSuccess,
}: EditEventModalProps) {
  // Focus trap for accessibility
  const focusRef = useFocusTrap(isOpen);

  // Form management
  const { form, watchEventType, watchEventClass } = useEditEventForm(event);

  // Step navigation
  const stepNavigation = useStepNavigation(
    watchEventType || event?.event_type || EventType.INFORMATIVE,
    watchEventClass || event?.event_class || EventClass.REGULAR
  );
  const {
    currentStep,
    availableSteps,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
    getProgress,
    goToStep,
  } = stepNavigation;

  // Error tracking
  const stepErrorHooks = useStepErrors(form, availableSteps);
  const {
    stepErrors,
    validateAllSteps,
    clearAllErrors,
    setFormErrorsFromStepErrors,
  } = stepErrorHooks;

  // Form helpers for dynamic arrays
  const formHelpers = useFormHelpers(form);

  // Submission logic
  const { onSubmit: handleSubmit, isSubmitting } = useEditEventSubmission(
    event?.id || "",
    event,
    onClose,
    onSuccess,
    validateAllSteps,
    setFormErrorsFromStepErrors,
    clearAllErrors
  );

  // Reset form and clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // When modal opens, reset to initial step and clear any previous errors
      goToStep("basic");
      clearAllErrors();
    } else {
      // When modal closes, clear errors and reset to basic step
      clearAllErrors();
      goToStep("basic");
    }
    // ESLint disable is intentional to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Early return if event is not provided
  if (!event) return null;

  // Form submission handler
  const onSubmit = async (data: EventFormValues) => {
    console.log("🎯 EditEventModal: Form submission triggered");
    console.log("📊 EditEventModal: Current step:", currentStep);
    console.log("📋 EditEventModal: Is last step:", isLastStep);
    console.log("📊 EditEventModal: Form data:", data);
    try {
      if (!isLastStep) {
        // For non-last steps, only do basic step validation for navigation
        console.log(
          "🔍 EditEventModal: Running step validation for navigation..."
        );
        const validation = validateStepCanProceed(currentStep, data, event);
        console.log("📊 EditEventModal: Step validation result:", validation);

        if (!validation.canProceed) {
          console.log("❌ EditEventModal: Step validation failed");
          // Also run comprehensive validation to highlight problematic fields
          console.log(
            "🔍 EditEventModal: Running comprehensive validation for error highlighting..."
          );
          const errors = await validateAllSteps(data);
          console.log(
            "📊 EditEventModal: Comprehensive validation errors:",
            errors
          );
          // Set form errors directly from the errors object
          if (Object.keys(errors).length > 0) {
            // Set form field errors directly
            Object.entries(errors).forEach(([, stepErrorsObj]) => {
              Object.entries(stepErrorsObj).forEach(
                ([fieldPath, errorMessage]) => {
                  form.setError(fieldPath as keyof EventFormValues, {
                    type: "validation",
                    message: errorMessage,
                  });
                }
              );
            });
          }
          toast.error(validation.validationMessage);
          return;
        }
        console.log("✅ EditEventModal: Step validation passed");
        console.log("➡️ EditEventModal: Not last step, navigating to next");
        // Clear any previous step errors when navigating
        clearAllErrors();
        nextStep();
        return;
      }

      // For the last step, use the comprehensive validation from useEditEventSubmission
      console.log(
        "🚀 EditEventModal: Last step - proceeding with comprehensive validation and submission"
      );
      await handleSubmit(data);
    } catch (error) {
      console.error("❌ EditEventModal: Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "basic":
        return <EditBasicInformationStep form={form} event={event} />;

      case "datetime":
        return <DateTimeStep form={form} />;

      case "tickets":
        return (
          <TicketsStep
            form={form}
            onAddTicket={formHelpers.tickets.add}
            onRemoveTicket={formHelpers.tickets.remove}
          />
        );

      case "additional":
        return (
          <AdditionalDetailsStep
            form={form}
            onAddBenefit={formHelpers.benefits.add}
            onRemoveBenefit={formHelpers.benefits.remove}
            onAddAgenda={formHelpers.agendas.add}
            onRemoveAgenda={formHelpers.agendas.remove}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        aria-describedby={undefined}
        ref={focusRef}
        className="w-[95vw] max-w-4xl max-h-[95vh] md:max-h-[90svh] flex flex-col p-0"
        onOpenAutoFocus={(event: Event) => {
          event.preventDefault();
          // Find the first focusable input and focus it
          const firstInput = document.querySelector(
            'input:not([type="hidden"]), select, textarea'
          );
          if (firstInput instanceof HTMLElement) {
            firstInput.focus();
          }
        }}
        closeButtonClassName="rounded-sm text-primary-700 border-2 border-primary-700 p-1 hover:bg-orange-100 hover:text-orange-600 transition-colors"
      >
        <DialogHeader className="space-y-4 flex-shrink-0 p-6 sm:p-4 pb-0">
          <DialogTitle asChild>
            <EditFormHeader
              eventClass={watchEventClass}
              onClose={onClose}
              form={form}
              eventTitle={event.event_title}
            />
          </DialogTitle>
          <StepIndicator
            currentStep={currentStep}
            availableSteps={availableSteps}
            stepErrors={stepErrors}
            progress={getProgress()}
            size="sm"
          />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ErrorSummary
                stepErrors={stepErrors}
                onStepClick={goToStep}
                availableSteps={availableSteps}
              />

              <div className="min-h-[400px] sm:min-h-[450px] md:min-h-[400px]">
                {renderCurrentStep()}
              </div>
            </form>
          </Form>

          <div className="flex-shrink-0 p-6 sm:p-4 pt-0 mt-4 border-t-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="pt-4">
                <EditStepNavigation
                  onPrevious={previousStep}
                  onNext={() => {}} // Form submission handles this
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  isSubmitting={isSubmitting}
                />
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
