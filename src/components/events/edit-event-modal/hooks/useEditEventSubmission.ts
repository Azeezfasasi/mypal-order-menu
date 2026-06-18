import { EventApi } from "@/services/api/business-events-api";
import { ICreateEventDto, IEvent } from "@/types/event-types";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  EventFormAgenda,
  EventFormBenefit,
  EventFormTicket,
  EventFormValues,
  StepErrors,
} from "../../create-event-modal/types";

export const useEditEventSubmission = (
  eventId: string,
  event: IEvent,
  onClose: () => void,
  onSuccess: () => void,
  validateAllSteps: (data: EventFormValues) => Promise<StepErrors>,
  setFormErrorsFromStepErrors: () => void,
  clearAllErrors: () => void
) => {
  const updateEventMutation = EventApi.useUpdateEvent();
  const { createEventFormData } = EventApi.useCreateEventFormData();

  const onSubmit = useCallback(
    async (data: EventFormValues): Promise<void> => {
      console.log("🚀 Starting edit form submission...");
      console.log("📊 Form data:", data);
      console.log("🆔 Event ID:", eventId);

      try {
        // For edit mode, handle image validation before step validation
        const hasExistingImage = !!event.flyer_url;
        const hasNewImage = !!data.image;
        const hasNewFlyerUrl =
          !!data.flyer_url && data.flyer_url !== event.flyer_url;
        const isGeneratingNewFlyer =
          data.image_preference === "generate" && hasNewFlyerUrl;

        console.log("🖼️ Image status:", {
          hasExistingImage,
          hasNewImage,
          hasNewFlyerUrl,
          isGeneratingNewFlyer,
          imagePreference: data.image_preference,
          existingUrl: event.flyer_url,
          newUrl: data.flyer_url,
        });

        // Validate that we have some form of image
        if (!hasNewImage && !hasExistingImage && !hasNewFlyerUrl) {
          console.log("❌ No image provided and no existing image");
          toast.error("Event image is required");
          return;
        }

        // Create modified data for step validation if needed
        let dataForValidation = data;
        if (!hasNewImage && !hasNewFlyerUrl && hasExistingImage) {
          // Create a placeholder File for validation purposes only
          dataForValidation = {
            ...data,
            image: new File([""], "existing-image.jpg", { type: "image/jpeg" }),
          };
          console.log("🔄 Created placeholder image for validation");
        }

        // Perform comprehensive validation with modified data
        console.log("🔍 Running step validation...");
        const errors = await validateAllSteps(dataForValidation);

        console.log("❗ Step validation errors:", errors);
        console.log("📝 Number of error steps:", Object.keys(errors).length);

        if (Object.keys(errors).length > 0) {
          console.log("🚨 Validation failed - showing errors to user");
          setFormErrorsFromStepErrors();
          toast.error("Please fix all errors before submitting");
          return;
        }

        console.log("✅ Step validation passed");

        // Prepare data for submission
        console.log("🔧 Preparing data for submission...");

        // Transform form data to ensure required fields are present
        const eventData = {
          ...data,
          // Handle image based on preference and what we have
          image: data.image_preference === "upload" ? data.image : undefined,
          image_preference:
            data.image_preference === "keep"
              ? undefined
              : data.image_preference,
          flyer_url:
            data.image_preference === "keep"
              ? event.flyer_url // Keep the existing URL
              : data.image_preference === "generate"
              ? data.flyer_url
              : undefined,
          flyer_prompt:
            data.image_preference === "generate"
              ? data.flyer_prompt
              : undefined,
          flyer_cta:
            data.image_preference === "generate" ? data.flyer_cta : undefined,
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          duration: data.duration || "",
          tickets:
            data.tickets?.map((ticket: EventFormTicket) => ({
              ...(ticket.id && { id: ticket.id }), // Include ID if it exists (for existing tickets)
              ticket_name: ticket.ticket_name,
              price: ticket.price,
            })) || [],
          benefits:
            data.benefits?.map((benefit: EventFormBenefit) => ({
              ...(benefit.id && { id: benefit.id }), // Include ID if it exists (for existing benefits)
              title: benefit.title,
              description: benefit.description,
            })) || [],
          agendas:
            data.agendas?.map((agenda: EventFormAgenda) => ({
              ...(agenda.id && { id: agenda.id }), // Include ID if it exists (for existing agendas)
              title: agenda.title,
              description: agenda.description,
              agendaType: agenda.agendaType,
              event_id: eventId || agenda.event_id || "",
            })) || [],
        };

        console.log("📤 Final event data to submit:", eventData);
        console.log("📤 Image info:", {
          preference: eventData.image_preference,
          hasImage: !!eventData.image,
          hasFlyerUrl: !!eventData.flyer_url,
          flyerPrompt: eventData.flyer_prompt,
          flyerCta: eventData.flyer_cta,
        });

        // Create form data using the API helper function
        console.log("📋 Creating FormData object...");
        const formData = createEventFormData(eventData as ICreateEventDto);

        console.log("📋 FormData created successfully");

        console.log("🌐 Sending API request...");
        await updateEventMutation.mutateAsync({
          eventId,
          data: formData,
        });

        console.log("🎉 API request successful: Event updated successfully");
        toast.success("Event updated successfully");
        clearAllErrors();
        onSuccess();
        onClose();
      } catch (error) {
        console.error("❌ Error during submission:", error);

        let errorMessage = "Failed to update event. Please try again.";

        if (error && typeof error === "object") {
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
          } else if ("message" in error && typeof error.message === "string") {
            try {
              const parsedError = JSON.parse(error.message);
              if (parsedError.message) {
                errorMessage = parsedError.message;
              }
            } catch {
              errorMessage = error.message;
            }
          } else if (
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
      eventId,
      event.flyer_url,
      validateAllSteps,
      setFormErrorsFromStepErrors,
      clearAllErrors,
      updateEventMutation,
      createEventFormData,
      onSuccess,
      onClose,
    ]
  );

  return {
    onSubmit,
    isSubmitting: updateEventMutation.isPending,
  };
};
