"use client";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import CreateDealModal from "@/components/deals/create-deal-modal";
import DealDetailsModal from "@/components/deals/deal-details-modal";
import DealsTable from "@/components/deals/deals-table";
import EditDealModal from "@/components/deals/edit-deal-modal";
import CreateEventModal from "@/components/events/create-event-modal/CreateEventModal";
import EventDetailsModal from "@/components/events/event-details-modal";
import EventsTable from "@/components/events/events-table";
import UpcomingEventsSection from "@/components/events/upcoming-events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { EventApi } from "@/services/api/business-events-api";
import { DealsApi } from "@/services/api/deals-api";
import { IDeal, IDealListItem } from "@/types/deal-types";
import { BusinessCategoryType, EventClass, EventType } from "@/types/enums";
import { IEvent, IEventListItem } from "@/types/event-types";
import { Calendar, Plus, PlusIcon, Tag } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function EventsPage() {
  const { user: business } = useAuth();
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"events" | "deals">("events");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null,
  );
  const [selectedEventClass, setSelectedEventClass] =
    useState<EventClass | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<IDeal | null>(null);
  const [showDealDetailsModal, setShowDealDetailsModal] = useState(false);
  const [showEditDealModal, setShowEditDealModal] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<IDeal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<IDealListItem | null>(null);
  const { mutate: deleteDeal, isPending: isDeleting } =
    DealsApi.useDeleteDeal();

  // Check if business can create exclusive events
  const canCreateExclusiveEvents =
    business?.category?.business_type === BusinessCategoryType.BEACHESRESORTS ||
    business?.category?.business_type === BusinessCategoryType.PARKSRECREATION;
  
  // check the backend data structure for /v1/events/admin/create
  useEffect(() => {
    if (business) {
      console.log("Business data from useAuth:", business);
    }
  }, [business]);


  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = EventApi.useGetBusinessEvents({
    page,
    limit,
    eventType: selectedEventType || undefined,
  });

  const {
    data: dealsData,
    isLoading: isLoadingDeals,
    refetch: refetchDeals,
  } = DealsApi.useGetBusinessDeals({
    page,
    limit,
  });

  const { data: upcomingDealsData, isLoading: isLoadingUpcomingDeals } =
    DealsApi.useGetBusinessUpcomingDeals();

  const handleCreateEvent = () => setShowEventTypeModal(true);
  const handleEventTypeSelect = (eventClass: EventClass) => {
    const eventType =
      eventClass === EventClass.EXCLUSIVE
        ? EventType.TICKET
        : EventType.INFORMATIVE;
    setSelectedEventType(eventType);
    setSelectedEventClass(eventClass);
    setShowEventTypeModal(false);
    const rafId = requestAnimationFrame(() => setShowCreateModal(true));
    return () => cancelAnimationFrame(rafId);
  };
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedEventType(null);
    setSelectedEventClass(null);
  };
  const handleViewEventDetails = (event: IEventListItem) => {
    setSelectedEvent(event as IEvent);
    setShowDetailsModal(true);
  };
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEvent(null);
  };
  const handleViewDealDetails = (deal: IDealListItem) => {
    setSelectedDeal(deal as IDeal);
    setShowDealDetailsModal(true);
  };
  const handleCloseDealDetailsModal = () => {
    setShowDealDetailsModal(false);
    setSelectedDeal(null);
  };
  const handleTabChange = (value: string) =>
    setActiveTab(value as "events" | "deals");
  const handleEditDeal = (deal: IDealListItem) => {
    setDealToEdit(deal as IDeal);
    setShowEditDealModal(true);
  };

  const handleDeleteDeal = (deal: IDealListItem) => {
    setDealToDelete(deal);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDeal = () => {
    if (dealToDelete) {
      deleteDeal(dealToDelete.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setDealToDelete(null);
          refetchDeals();
        },
      });
    }
  };

  return (
    <div className="space-y-8 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-xl font-bold text-gray-900">
            Events & Deals Management
          </h1>
          <p className="text-gray-600 md:text-sm">
            Leverage MyPal’s AI capabilities to effortlessly create stunning,
            information-rich flyers that resonate with your audience and
            captivate potential customers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="events"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Deals
          </TabsTrigger>
        </TabsList>

        {/* Events Tab Content */}
        <TabsContent value="events" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-orange-600">Events</h2>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleCreateEvent}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create event
            </Button>
          </div>

          {isLoadingEvents ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
            </div>
          ) : (
            <>
              <EventsTable
                events={eventsData?.data?.data || []}
                currentPage={page}
                totalPages={eventsData?.data?.totalPages || 1}
                onPageChange={setPage}
                onViewDetails={handleViewEventDetails}
                onEventUpdated={() => {
                  refetchEvents();
                }}
              />
            </>
          )}

          <UpcomingEventsSection />
        </TabsContent>

        {/* Deals Tab Content */}
        <TabsContent value="deals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-orange-600">Deals</h2>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => setShowCreateDealModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create deal
            </Button>
          </div>

          {isLoadingDeals ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
            </div>
          ) : (
            <>
              <DealsTable
                deals={dealsData?.data?.data || []}
                currentPage={page}
                totalPages={dealsData?.data?.totalPages || 1}
                onPageChange={setPage}
                onViewDetails={handleViewDealDetails}
                onEditDeal={handleEditDeal}
                onDeleteDeal={handleDeleteDeal}
                onDealUpdated={() => {
                  refetchDeals();
                }}
              />
            </>
          )}

          {/* Upcoming Deals Section */}
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-bold text-orange-600">
              Upcoming Deals
            </h2>

            {isLoadingUpcomingDeals ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingDealsData?.data?.data &&
                upcomingDealsData.data.data.length > 0 ? (
                  upcomingDealsData.data.data.map((deal: IDealListItem) => (
                    <div
                      key={deal.id}
                      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="h-40 bg-gray-200 relative">
                        {deal.flyer_url ? (
                          <Image
                            src={deal.flyer_url}
                            alt={deal.deal_title}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            No Image
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                          {formatCurrency(deal.price)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {deal.deal_title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(deal.start_date).toLocaleDateString()} -{" "}
                          {new Date(deal.end_date).toLocaleDateString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleViewDealDetails(deal)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No upcoming deals found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Class Selection Modal */}
      <Dialog open={showEventTypeModal} onOpenChange={setShowEventTypeModal}>
        <DialogContent className="max-w-2xl md:w-[95%] rounded-[8px] p-10 md:py-6 md:px-4">
          <div className="text-center mb-8">
            <h2 className="text-[24px] font-bold text-gray-900 leading-[100%]">Create Event</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
            {/* Regular Event Card */}
            <div className="h-[175px] bg-[#FEF2EE] rounded-[10px] p-8 flex flex-col border border-[#DBDBDB]">
              <div className="mb-6">
                <h3 className="text-[16px] font-bold text-[#DB3A07] mb-2 leading-[100%] text-center">
                  Regular Event
                </h3>
                <p className="text-[12px] text-[#363C44] text-sm mb-1 font-semibold leading-[100%] text-center">
                  Open to all users
                </p>
                <p className="text-[12px] text-[#363C44] text-sm font-semibold leading-[100%] text-center">
                  Standard Publishing
                </p>
              </div>
              <Button
                className="w-full bg-[#DE5126] hover:bg-[#C1451F] text-white font-semibold p-2 rounded-[8px]"
                onClick={() => handleEventTypeSelect(EventClass.REGULAR)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Regular Event
              </Button>
            </div>

            {/* Exclusive Event Card */}
            {canCreateExclusiveEvents ? (
              <div className="bg-[#E9F0FD] rounded-[10px] p-8 flex flex-col border border-[#DBDBDB]">
                <div className="mb-6">
                  <h3 className="text-[16px] font-bold leading-[100%] text-center text-blue-600 mb-2">
                    Exclusive Event
                  </h3>
                  <p className="text-[12px] text-[#363C44] mb-1 font-semibold leading-[100%] text-center">
                    Restricted Access
                  </p>
                  <p className="text-[12px] text-[#363C44] text-sm font-semibold leading-[100%] text-center">
                    Invite-only & Premium Audience
                  </p>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-[8px]"
                  onClick={() => handleEventTypeSelect(EventClass.EXCLUSIVE)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Exclusive Event
                </Button>
              </div>
            ) : (
              <div className="bg-gray-300 border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-col items-center justify-center">
                <div className="mb-6">
                  <h3 className="text-[16px] font-bold leading-[100%] text-center text-blue-600 mb-2">
                    Exclusive Event
                  </h3>
                  <p className="text-[12px] text-[#363C44] text-sm mb-1 font-semibold leading-[100%] text-center">
                  Restricted Access
                  </p>
                  <p className="text-[12px] text-[#363C44] text-sm font-semibold leading-[100%] text-center">
                    Invite-only & Premium Audience
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleEventTypeSelect(EventClass.EXCLUSIVE)}
                  disabled={!canCreateExclusiveEvents}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Exclusive Event
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        eventType={selectedEventType}
        eventClass={selectedEventClass}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        event={selectedEvent}
      />

      {/* Deal Details Modal */}
      <DealDetailsModal
        isOpen={showDealDetailsModal}
        onClose={handleCloseDealDetailsModal}
        deal={selectedDeal}
      />

      {/* Create Deal Modal */}
      <CreateDealModal
        isOpen={showCreateDealModal}
        onClose={() => setShowCreateDealModal(false)}
        onDealCreated={() => refetchDeals()}
      />
      {/* Edit Deal Modal */}
      <EditDealModal
        isOpen={showEditDealModal}
        onClose={() => {
          setShowEditDealModal(false);
          setDealToEdit(null);
        }}
        deal={dealToEdit}
        onDealUpdated={() => refetchDeals()}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDealToDelete(null);
        }}
        onConfirm={confirmDeleteDeal}
        title="Delete Deal"
        description={`Are you sure you want to delete the deal "${dealToDelete?.deal_title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
