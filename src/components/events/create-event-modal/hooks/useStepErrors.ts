import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  EventFormValues,
  Step,
  StepErrors,
  UseStepErrorsReturn,
} from "../types";
import { createEventFormSchema } from "../validation";

export const useStepErrors = (
  form: ReturnType<typeof useForm<EventFormValues>>,
  availableSteps: Step[]
): UseStepErrorsReturn => {
  const [stepErrors, setStepErrors] = useState<StepErrors>({});

  // Map fields to their respective steps
  const stepFieldMap = useMemo(
    () =>
      ({
        basic: [
          "event_title",
          "location",
          "event_type",
          "event_class",
          "about",
          "is_eighten_plus",
          "image",
          "image_preference",
          "flyer_prompt",
          "flyer_cta",
          "flyer_url",
        ],
        datetime: [
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "duration",
        ],
        tickets: ["tickets"],
        additional: ["benefits", "agendas"],
      } as { [key in Step]: string[] }),
    []
  );

  const validateAllSteps = useCallback(
    async (data: EventFormValues, isSubmitting: boolean = true): Promise<StepErrors> => {
      console.log("🔍 useStepErrors: Starting validation for all steps");
      console.log("📊 useStepErrors: Data to validate:", data);
      console.log("📋 useStepErrors: Available steps:", availableSteps);
      console.log("🔐 useStepErrors: Is submitting:", isSubmitting);

      const errors: StepErrors = {};

      // Create comprehensive validation schema
      console.log("🔧 useStepErrors: Creating validation schema...");
      const fullValidationSchema = createEventFormSchema(
        data.event_type,
        data.event_class,
        "additional", // Use the most comprehensive step
        isSubmitting // Use parameter to determine strict vs lenient validation
      );
      console.log("✅ useStepErrors: Validation schema created");

      try {
        console.log("🔍 useStepErrors: Running schema validation...");
        await fullValidationSchema.parseAsync(data);
        console.log("✅ useStepErrors: All validation passed - no errors");
        setStepErrors({});
        return {};
      } catch (validationError) {
        console.log("❌ useStepErrors: Validation failed");
        console.error("❌ useStepErrors: Validation error:", validationError);

        if (validationError instanceof z.ZodError) {
          console.log("🔍 useStepErrors: Processing Zod validation errors...");
          console.log(
            "📝 useStepErrors: Number of issues:",
            validationError.errors.length
          );

          validationError.errors.forEach((error, index) => {
            console.log(`❌ useStepErrors: Error ${index + 1}:`, error);
            const fieldPath = error.path.join(".");
            console.log(`📍 useStepErrors: Field path: "${fieldPath}"`);

            // Determine which step this error belongs to
            let errorStep: Step | null = null;

            for (const [step, fields] of Object.entries(stepFieldMap)) {
              if (fields.some((field) => fieldPath.startsWith(field))) {
                errorStep = step as Step;
                console.log(
                  `📋 useStepErrors: Error belongs to step: "${errorStep}"`
                );
                break;
              }
            }

            if (errorStep && availableSteps.includes(errorStep)) {
              if (!errors[errorStep]) {
                errors[errorStep] = {};
              }
              errors[errorStep][fieldPath] = error.message;
              console.log(
                `✅ useStepErrors: Added error to step "${errorStep}": ${error.message}`
              );
            } else {
              console.log(
                `⚠️ useStepErrors: Error step "${errorStep}" not in available steps or is null`
              );
            }
          });

          console.log("📊 useStepErrors: Final errors object:", errors);
        } else {
          console.log(
            "❌ useStepErrors: Non-Zod validation error:",
            validationError
          );
        }

        setStepErrors(errors);
        return errors;
      }
    },
    [availableSteps, stepFieldMap]
  );

  const clearStepErrors = useCallback(() => {
    console.log("🧹 useStepErrors: Clearing step errors");
    setStepErrors({});
  }, []);

  const clearFormErrors = useCallback(() => {
    console.log("🧹 useStepErrors: Clearing form errors");
    form.clearErrors();
  }, [form]);

  const clearAllErrors = useCallback(() => {
    console.log("🧹 useStepErrors: Clearing all errors (step + form)");
    setStepErrors({});
    form.clearErrors();
  }, [form]);

  const getStepErrorCount = useCallback(
    (step: Step): number => {
      return stepErrors[step] ? Object.keys(stepErrors[step]).length : 0;
    },
    [stepErrors]
  );

  const setFormErrorsFromStepErrors = useCallback(() => {
    // Set form errors to highlight fields with validation issues
    Object.entries(stepErrors).forEach(([, stepErrorsObj]) => {
      Object.entries(stepErrorsObj).forEach(([fieldPath, errorMessage]) => {
        // Type assertion is necessary here because react-hook-form's FieldPath type is complex
        form.setError(fieldPath as keyof EventFormValues, {
          type: "validation",
          message: errorMessage,
        });
      });
    });
  }, [stepErrors, form]);

  return {
    stepErrors,
    validateAllSteps,
    clearStepErrors,
    clearFormErrors,
    clearAllErrors,
    getStepErrorCount,
    setFormErrorsFromStepErrors,
  };
};
