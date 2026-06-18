"use client";

// import type { ICreateServiceItemDto } from "@/types/service-offering-types";
// import { MenuHeader } from "../menu/header";
// import ErrorHandler from "@/components/shared/error-handler";
// import Loader from "@/components/shared/loading-spinner";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { useAuthStore } from "@/stores/auth-store";
// import { toast } from "sonner";
// import { Category } from "../menu/types";
// import AttractionsManagement from "../shared/attraction-management";
import CancellationPolicySection from "../shared/CancellationPolicySection";
import BusinessTransactionInformation from "../shared/transaction-settings-section";
import EventsManagement from "./events-management";
import ReservationsList from "./reservations-list";
import NightlifeProfile from "./nightlife-profile";

export default function NightlifeOfferingContent() {
  const { business } = useAuthStore();
  
  // Check if the business is one of the nightlife-related categories
  const NIGHTLIFE_CATEGORIES = ['Luxury Night', 'Bars & Lounges', 'Club', 'Food & Drinks', 'Events Nights'];
  const isNightlifeBusiness = business?.business_type && NIGHTLIFE_CATEGORIES.includes(business.business_type);

  console.log("🌙 [NIGHTLIFE-INDEX] Rendering NightlifeOfferingContent");
  console.log("🌙 [NIGHTLIFE-INDEX] Business type:", business?.business_type);
  console.log("🌙 [NIGHTLIFE-INDEX] isNightlifeBusiness:", isNightlifeBusiness);

  // Load nightlife-specific data if it's a nightlife business
  const nightlifeMenuData = ServiceOfferingApi.useBusinessMenus();

  // Use the appropriate data based on business type
  const {
    // isLoading: menuLoading,
    // error: menuError,
  } = nightlifeMenuData;

  // const createCategory = ServiceOfferingApi.useCreateCategoryWithImage();

  // const handleAddCategory = async (formData: FormData) => {
  //   const promise = createCategory.mutateAsync(formData);

  //   toast.promise(promise, {
  //     loading: "Creating category...",
  //     success: "Category created successfully!",
  //     error: (error) => {
  //       const errorMessage =
  //         error instanceof Error
  //           ? error.message
  //           : "An unknown error occurred while adding menu category.";
  //       return errorMessage;
  //     },
  //   });
  // };

  // Nightlife event handlers (ready for future event management component)
  // const handleCreateEvent = async (
  //   eventData: ICreateEventDto,
  //   images?: File[],
  // ) => {
  //   const promise = createEvent.mutateAsync({
  //     eventData,
  //     images,
  //   });

  //   toast.promise(promise, {
  //     loading: "Creating event...",
  //     success: "Event created successfully!",
  //     error: (error) => {
  //       const errorMessage =
  //         error instanceof Error
  //           ? error.message
  //           : "An unknown error occurred while creating the event.";
  //       return `Failed to create event: ${errorMessage}`;
  //     },
  //   });
  // };

  // const handleUpdateEvent = async (
  //   eventId: string,
  //   eventData: IUpdateEventDto,
  //   images?: File[],
  // ) => {
  //   const promise = updateEvent.mutateAsync({
  //     id: eventId,
  //     eventData,
  //     images,
  //   });

  //   toast.promise(promise, {
  //     loading: "Updating event...",
  //     success: "Event updated successfully!",
  //     error: (error) => {
  //       const errorMessage =
  //         error instanceof Error
  //           ? error.message
  //           : "An unknown error occurred while updating the event.";
  //       return `Failed to update event: ${errorMessage}`;
  //     },
  //   });
  // };

  // const handleDeleteEvent = async (eventId: string) => {
  //   const promise = deleteEvent.mutateAsync(eventId);

  //   toast.promise(promise, {
  //     loading: "Deleting event...",
  //     success: "Event deleted successfully!",
  //     error: (error) => {
  //       const errorMessage =
  //         error instanceof Error
  //           ? error.message
  //           : "An unknown error occurred while deleting the event.";
  //       return `Failed to delete event: ${errorMessage}`;
  //     },
  //   });
  // };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-5 md:max-w-full">
          {/* Business Categories & Menu Section */}
          {/* {menuError ? (
            <ErrorHandler message="Error loading menu data" />
          ) : menuLoading ? (
              <Loader message="Loading nightlife business offerings" />
          ) : (
              <MenuHeader onAddCategory={handleAddCategory} />
          )} */}

          {/* Nightlife Specific Sections */}
          <EventsManagement />
          <ReservationsList />
          <NightlifeProfile />

          {/* Cancellation Policy Section */}
          <CancellationPolicySection />

          {/* Transaction Information Section */}
          <BusinessTransactionInformation />
        </div>
      </div>
    </main>
  );
}
