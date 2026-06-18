import { EventApi } from "@/services/api/business-events-api";
import { EventClass, EventType } from "@/types/enums";
import { useAuth } from "@/hooks/use-auth";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  EventFormValues,
  EventSubmissionOptions,
  StepErrors,
  UseEventSubmissionReturn,
} from "../types";
import { createSubmissionSchema } from "../validation";
import { mapFormToApiRequest, validateApiRequest, convertApiRequestToFormDataOriginal } from "../utils/apiDataMapper";

export const useEventSubmission = (
  onClose: () => void,
  validateAllSteps: (data: EventFormValues, isSubmitting?: boolean) => Promise<StepErrors>,
  setFormErrorsFromStepErrors: () => void,
  clearAllErrors: () => void,
  options: EventSubmissionOptions = {},
): UseEventSubmissionReturn => {
  const { mode = "create", eventId } = options;
  const { user: business } = useAuth();
  const createEventMutation = EventApi.useCreateEvent();

  // Robust business ID resolution - try multiple possible field names
  const resolvedBusinessId = (() => {
    const possibleIds = [
      ((business as unknown as Record<string, unknown>)?.id),
      ((business as unknown as Record<string, unknown>)?._id),
      ((business as unknown as Record<string, unknown>)?.businessId),
      ((business as unknown as Record<string, unknown>)?.business_id),
    ];
    const found = possibleIds.find(id => !!id && String(id).trim().length > 0) as string | undefined;
    console.log("🔍 [useEventSubmission] Business ID resolution:");
    console.log("   Raw user object keys:", business ? Object.keys(business) : "NO USER");
    console.log("   Possible IDs:", possibleIds);
    console.log("   Resolved businessId:", found || "NOT FOUND");
    return found;
  })();

  const onSubmit = useCallback(
    async (data: EventFormValues): Promise<void> => {
      console.log("🚀 Starting form submission...");
      console.log("📊 Form data:", data);
      console.log("⚙️ Submission options:", { mode, eventId });
      console.log("🏢 Resolved businessId:", resolvedBusinessId);

      try {
        // Final validation using submission schema
        console.log("🔍 Running final schema validation...");
        const submissionSchema = createSubmissionSchema(
          data.event_type,
          data.event_class,
        );

        try {
          console.log("📋 Validating with submission schema...");
          console.log("🔍 Schema being used:", submissionSchema);
          console.log("📊 Data being validated:", data);

          // Let's check each required field individually
          console.log("🔍 Checking individual fields:");
          console.log("  - event_title:", data.event_title);
          console.log("  - location:", data.location);
          console.log("  - event_type:", data.event_type);
          console.log("  - event_class:", data.event_class);
          console.log("  - about:", data.about);
          console.log("  - start_date:", data.start_date);
          console.log("  - end_date:", data.end_date);
          console.log("  - start_time:", data.start_time);
          console.log("  - end_time:", data.end_time);
          console.log("  - duration:", data.duration);
          console.log("  - image:", data.image ? "File" : "undefined");
          console.log("  - image_preference:", data.image_preference);
          console.log("  - flyer_url:", data.flyer_url);
          console.log("  - flyer_prompt:", data.flyer_prompt);
          console.log("  - flyer_cta:", data.flyer_cta);
          console.log("  - is_eighten_plus:", data.is_eighten_plus);
          console.log("  - tickets:", data.tickets);
          console.log(
            "  - tickets info:",
            data.tickets.map((t) => ({
              name: t.ticket_name,
              price: t.price,
            })),
          );
          console.log("  - benefits:", data.benefits);
          console.log("  - agendas:", data.agendas);

          const validatedData = submissionSchema.parse(data);
          console.log("✅ Schema validation passed");
          console.log("📋 Validated data:", validatedData);

          // Check if we have either an uploaded image or a flyer URL
          if (!validatedData.image && !validatedData.flyer_url) {
            console.log("🖼️ No image or flyer URL found in validated data");
            console.log("🖼️ Image preference:", validatedData.image_preference);
            console.log("🖼️ Image value:", validatedData.image);
            console.log("🖼️ Flyer URL value:", validatedData.flyer_url);
            throw new Error("Event image is required");
          }

          console.log("🖼️ Image validation passed", {
            hasImage: !!validatedData.image,
            hasFlyerUrl: !!validatedData.flyer_url,
            preference: validatedData.image_preference,
          });

          // Prepare data for submission
          console.log("🔧 Preparing data for submission...");
          // Transform form data to ensure required fields are present
          const eventData = {
            ...data,
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            start_time: data.start_time || "",
            end_time: data.end_time || "",
            duration: data.duration || "",
            // Handle image based on preference
            image:
              data.image_preference === "upload"
                ? (data.image as File)
                : undefined,
            // Include all flyer-related fields for AI-generated images
            image_preference:
              data.image_preference === "keep"
                ? undefined
                : data.image_preference,
            flyer_url:
              data.image_preference === "generate" ? data.flyer_url : undefined,
            flyer_prompt:
              data.image_preference === "generate"
                ? data.flyer_prompt
                : undefined,
            flyer_cta:
              data.image_preference === "generate" ? data.flyer_cta : undefined,
            // Only include tickets for TICKET events
            tickets:
              data.event_type === EventType.TICKET
                ? data.tickets?.map((ticket) => ({
                    ticket_name: ticket.ticket_name,
                    price: ticket.price,
                  })) || []
                : undefined,
            // Only include benefits and agendas for EXCLUSIVE events
            benefits:
              data.event_class === EventClass.EXCLUSIVE
                ? data.benefits?.map((benefit) => ({
                    title: benefit.title,
                    description: benefit.description,
                  })) || []
                : undefined,
            agendas:
              data.event_class === EventClass.EXCLUSIVE
                ? data.agendas?.map((agenda) => ({
                    title: agenda.title,
                    description: agenda.description,
                    agendaType: agenda.agendaType,
                    event_id:
                      mode === "create" ? "" : eventId || agenda.event_id || "",
                  })) || []
                : undefined,
          } as const;

          console.log("📤 Final event data to submit:", eventData);
          console.log("📤 Image info:", {
            preference: eventData.image_preference,
            hasImage: !!eventData.image,
            hasFlyerUrl: !!eventData.flyer_url,
            flyerPrompt: eventData.flyer_prompt,
            flyerCta: eventData.flyer_cta,
          });
          console.log(
            "📤 Final tickets:",
            eventData.tickets
              ? eventData.tickets.map((t) => ({
                  name: t.ticket_name,
                  price: t.price,
                }))
              : "None (not a ticket event)",
          );
          console.log(
            "📤 Final benefits:",
            eventData.benefits || "None (not exclusive)",
          );
          console.log(
            "📤 Final agendas:",
            eventData.agendas || "None (not exclusive)",
          );

          // NOTE: API Alignment - Map form data to new API format
          // This mapping aligns with the API specification for /v1/events/create
          console.log("🔄 Performing API data mapping (dual format)...");
          const apiRequest = await mapFormToApiRequest(data, resolvedBusinessId);
          console.log("📋 Mapped API request object:", apiRequest);
          
          const apiValidation = validateApiRequest(apiRequest);
          console.log("🔍 API validation result:", apiValidation);
          
          if (!apiValidation.valid) {
            console.error("❌ API request validation failed:", apiValidation.errors);
            const errorList = apiValidation.errors
              .map((err, idx) => `${idx + 1}. ${err}`)
              .join("\n");
            const errorMsg = `Please check the following:\n${errorList}`;
            toast.error(errorMsg);
            console.error("❌ Complete error details:\n" + errorMsg);
            return;
          }
          console.log("✅ API request validation passed");

          // Convert API request to FormData using the utility function
          console.log("📋 Converting API request to FormData (dual format)...");
          const submitData = convertApiRequestToFormDataOriginal(apiRequest);
          console.log("📋 FormData prepared successfully");
          
          // Log FormData contents for debugging
          console.log("📋 FormData contents:");
          const loggedKeys = new Set<string>();
          for (const [key, value] of submitData.entries()) {
            if (loggedKeys.has(key)) continue;
            loggedKeys.add(key);
              if (value instanceof File) {
                console.log(`  - ${key}: File(${value.name}, ${value.size} bytes, type: ${value.type})`);
              } else {
                const stringValue = String(value).substring(0, 100);
                console.log(`  - ${key}: ${stringValue}${String(value).length > 100 ? "..." : ""}`);
              }
            }
            console.log("📋 FormData entries count:", Array.from(submitData.entries()).length);

          console.log("🌐 Sending API request as FormData (dual format: old + new field names)...");
          console.log("   Total entries:", Array.from(submitData.entries()).length);

          await createEventMutation.mutateAsync(submitData);

          const successMessage =
            mode === "create"
              ? "Event created successfully"
              : "Event updated successfully";
          console.log("🎉 API request successful:", successMessage);
          toast.success(successMessage);
          clearAllErrors();
          onClose();
        } catch (validationError) {
          console.error("❌ Final validation failed:", validationError);

          if (validationError instanceof Error) {
            console.error("❌ Validation error details:", {
              name: validationError.name,
              message: validationError.message,
              // Check if it's a Zod error
              issues:
                "issues" in validationError
                  ? validationError.issues
                  : undefined,
            });

            // If it's a Zod error, log each issue in detail
            if (
              "issues" in validationError &&
              Array.isArray(validationError.issues)
            ) {
              console.error("❌ Detailed Zod validation issues:");
              const issues = validationError.issues as Array<{
                path: (string | number)[];
                message: string;
                code: string;
                received?: unknown;
                expected?: unknown;
              }>;
              
              issues.forEach((issue, index) => {
                console.error(`  Issue ${index + 1}:`, {
                  path: issue.path,
                  message: issue.message,
                  code: issue.code,
                  received: issue.received,
                  expected: issue.expected,
                });
              });
              
              // Show the first error message to the user
              if (issues.length > 0) {
                const firstError = issues[0];
                const fieldPath = firstError.path.join(".");
                const errorMsg = `${fieldPath}: ${firstError.message}`;
                toast.error(errorMsg);
                return;
              }
            }
          }

          toast.error("Please fill in all required fields before submitting");
          return;
        }
      } catch (error) {
        console.error("❌ Error during submission:", error);

        // Handle API error responses
        let errorMessage = "Failed to create event. Please try again.";

        if (error && typeof error === "object") {
          // Check for API error response structure
          if (
            "response" in error &&
            error.response &&
            typeof error.response === "object"
          ) {
            const response = error.response as {
              data?: { message?: string; statusCode?: number };
            };
            if (response.data && response.data.message) {
              errorMessage = response.data.message;
              console.error("❌ API Error Message:", response.data.message);
              console.error("❌ API Error Status:", response.data.statusCode);
            }
          }
          // Check for direct error message (some APIs return error directly)
          else if ("message" in error && typeof error.message === "string") {
            // Check if the message contains JSON (some APIs return JSON strings)
            try {
              const parsedError = JSON.parse(error.message);
              if (parsedError.message) {
                errorMessage = parsedError.message;
              }
            } catch {
              // If not JSON, use the message directly
              errorMessage = error.message;
            }
          }
          // Check for mutation error (React Query format)
          else if (
            "data" in error &&
            error.data &&
            typeof error.data === "object"
          ) {
            const data = error.data as {
              message?: string;
              statusCode?: number;
            };
            if (data.message) {
              errorMessage = data.message;
              console.error("❌ Mutation Error Message:", data.message);
              console.error("❌ Mutation Error Status:", data.statusCode);
            }
          }
        }

        console.error("❌ Final error message:", errorMessage);
        toast.error(errorMessage);
      }
    },
    [
      clearAllErrors,
      createEventMutation,
      onClose,
      mode,
      eventId,
      resolvedBusinessId,
    ],
  );

  return {
    onSubmit,
    isSubmitting: createEventMutation.isPending,
  };
};
