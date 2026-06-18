"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ContextType, EventClass, EventType } from "@/types/enums";
import { useEffect } from "react";
import { toast } from "sonner";
import { ErrorSummary } from "../error-summary";
import {
  AdditionalDetailsStep,
  BasicInformationStep,
  DateTimeStep,
  FormHeader,
  StepIndicator,
  StepNavigation,
  TicketsStep,
} from "./components";
import {
  useCreateEventForm,
  useEventSubmission,
  useStepErrors,
  useStepNavigation,
} from "./hooks";
import { CreateEventModalProps, EventFormValues } from "./types";
import { useFormHelpers, validateStepCanProceed } from "./utils";

export default function CreateEventModal({
  isOpen,
  onClose,
  eventType,
  eventClass,
}: CreateEventModalProps) {
  // Focus trap for accessibility
  const focusRef = useFocusTrap(isOpen);

  // Form management - moved before early return
  const { form, watchEventType, watchEventClass } = useCreateEventForm(
    eventType,
    eventClass
  );

  // Step navigation
  const stepNavigation = useStepNavigation(
    watchEventType || eventType || EventType.INFORMATIVE,
    watchEventClass || eventClass || EventClass.REGULAR
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
  const { onSubmit: handleSubmit, isSubmitting } = useEventSubmission(
    onClose,
    validateAllSteps,
    setFormErrorsFromStepErrors,
    clearAllErrors,
    { mode: "create" } // Explicitly pass create mode
  );

  // Reset form and clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // When modal opens, reset to initial step and clear any previous errors
      goToStep("basic");
      clearAllErrors();
    } else {
      // When modal closes, reset form to default values and clear errors
      form.reset();
      clearAllErrors();
      goToStep("basic");
    }
    // ESLint disable is intentional to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Early return if props are not ready
  if (!eventType || !eventClass) return null;

  // Form submission handler
  const onSubmit = async (data: EventFormValues) => {
    console.log("🎯 CreateEventModal: Form submission triggered");
    console.log("📊 CreateEventModal: Current step:", currentStep);
    console.log("📋 CreateEventModal: Is last step:", isLastStep);
    console.log("📊 CreateEventModal: Available steps:", availableSteps);
    console.log("📊 CreateEventModal: Event Type:", watchEventType);
    console.log("📊 CreateEventModal: Event Class:", watchEventClass);
    console.log("📊 CreateEventModal: Form data:", data);

    try {
      if (!isLastStep) {
        // For non-last steps, only do basic step validation for navigation
        console.log(
          "🔍 CreateEventModal: Running step validation for navigation..."
        );

        // Make sure we have appropriate arrays initialized
        if (watchEventClass === EventClass.EXCLUSIVE) {
          console.log(
            "🧩 Checking arrays for EXCLUSIVE event before validation"
          );
          console.log("🧩 Benefits:", data.benefits);
          console.log("🧩 Agendas:", data.agendas);

          // Initialize benefits and agendas if they don't exist or are empty
          if (!data.benefits || data.benefits.length === 0) {
            console.log("⚙️ Adding default benefit for validation");
            const defaultBenefit = { title: "", description: "" };
            form.setValue("benefits", [defaultBenefit]);
            data.benefits = [defaultBenefit];
          } else {
            // If benefits exist but some have empty descriptions, log a warning
            const emptyDescriptions = data.benefits.filter(
              (benefit) => !benefit.description
            );
            if (emptyDescriptions.length > 0) {
              console.warn(
                "⚠️ Some benefits have empty descriptions:",
                emptyDescriptions
              );
              console.warn(
                "⚠️ Full benefits data:",
                JSON.stringify(data.benefits, null, 2)
              );
            } else {
              console.log("✅ All benefits have descriptions:", data.benefits);
            }
          }

          if (!data.agendas || data.agendas.length === 0) {
            console.log("⚙️ Adding default agenda for validation");
            const defaultAgenda = {
              title: "",
              description: "",
              agendaType: ContextType.EVENT,
            };
            form.setValue("agendas", [defaultAgenda]);
            data.agendas = [defaultAgenda];
          } else {
            // If agendas exist but some have empty descriptions, log a warning
            const emptyDescriptions = data.agendas.filter(
              (agenda) => !agenda.description
            );
            if (emptyDescriptions.length > 0) {
              console.warn(
                "⚠️ Some agendas have empty descriptions:",
                emptyDescriptions
              );
              console.warn(
                "⚠️ Full agendas data:",
                JSON.stringify(data.agendas, null, 2)
              );
            } else {
              console.log("✅ All agendas have descriptions:", data.agendas);
            }
          }

          // Log the updated arrays
          console.log("🧩 Updated Benefits:", data.benefits);
          console.log("🧩 Updated Agendas:", data.agendas);
        }

        const validation = validateStepCanProceed(currentStep, data);
        console.log("📊 CreateEventModal: Step validation result:", validation);

        if (!validation.canProceed) {
          console.log("❌ CreateEventModal: Step validation failed");

          // Also run comprehensive validation to highlight problematic fields
          // Use isSubmitting: false for step navigation to avoid image validation
          console.log(
            "🔍 CreateEventModal: Running comprehensive validation for error highlighting..."
          );
          const errors = await validateAllSteps(data, false);
          console.log(
            "📊 CreateEventModal: Comprehensive validation errors:",
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

        console.log("✅ CreateEventModal: Step validation passed");
        console.log("➡️ CreateEventModal: Not last step, navigating to next");
        // Clear any previous step errors when navigating
        clearAllErrors();

        // For Exclusive events, always ensure we have arrays initialized
        // This is important because validation might be checking these arrays
        if (watchEventClass === EventClass.EXCLUSIVE) {
          const nextStepIndex = availableSteps.indexOf(currentStep) + 1;
          const nextStepName = availableSteps[nextStepIndex];

          console.log("🚀 Next step for exclusive event:", nextStepName);
          console.log("🚀 Current benefits:", form.getValues("benefits"));
          console.log("🚀 Current agendas:", form.getValues("agendas"));

          // Always ensure we have at least one benefit and agenda for EXCLUSIVE events
          // regardless of which step we're on or where we're going
          if (
            !form.getValues("benefits") ||
            form.getValues("benefits").length === 0
          ) {
            console.log("⚙️ Adding default benefit before navigation");
            formHelpers.benefits.add();
          }

          if (
            !form.getValues("agendas") ||
            form.getValues("agendas").length === 0
          ) {
            console.log("⚙️ Adding default agenda before navigation");
            formHelpers.agendas.add();
          }
        }

        nextStep();
        return;
      }

      // For the last step, use the comprehensive validation from useEventSubmission
      console.log(
        "🚀 CreateEventModal: Last step - proceeding with comprehensive validation and submission"
      );
      await handleSubmit(data);
    } catch (error) {
      console.error("❌ CreateEventModal: Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "basic":
        return <BasicInformationStep form={form} />;

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
        {/* <div className="flex-shrink-0 p-6 pb-0"> */}
        <DialogHeader className="space-y-4 flex-shrink-0 p-6 sm:p-4 pb-0">
          <DialogTitle asChild>
            <FormHeader
              eventClass={watchEventClass}
              onClose={onClose}
              form={form}
            />
          </DialogTitle>
          <StepIndicator
            currentStep={currentStep}
            availableSteps={availableSteps}
            stepErrors={stepErrors}
            progress={getProgress()}
            size="sm"
            // showSummary={false} // Show in development
            hideSteps={true} // Hide in production
          />
        </DialogHeader>
        {/* </div> */}

        <div className="flex-1 overflow-y-auto px-6 sm:px-4 py-6 sm:py-4 flex flex-col">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log(
                  "❌ Form validation errors preventing submission:",
                  errors
                );
              })}
              className="space-y-6 flex flex-col flex-1"
            >
              <ErrorSummary
                stepErrors={stepErrors}
                onStepClick={goToStep}
                availableSteps={availableSteps}
              />

              <div className="min-h-[400px] sm:min-h-[450px] md:min-h-[400px] flex-1">
                {renderCurrentStep()}
              </div>

              <div className="flex-shrink-0 pt-4 mt-4 border-t-2">
                <StepNavigation
                  onPrevious={previousStep}
                  onNext={nextStep}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  isSubmitting={isSubmitting}
                />
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
