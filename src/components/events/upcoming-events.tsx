"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventApi } from "@/services/api/business-events-api";
import { EventClass, EventType } from "@/types/enums";
import { IEventListItem } from "@/types/event-types";
import { format } from "date-fns";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import CreateEventModal from "./create-event-modal";
import EventDetailModal from "./event-details-modal";

interface UpcomingEventsSectionProps {
  type?: EventType;
  limit?: number;
}

export default function UpcomingEventsSection({
  type,
  limit = 5,
}: UpcomingEventsSectionProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IEventListItem | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading, error } = EventApi.useGetBusinessUpcomingEvents({
    type,
    limit,
    page: 1,
  });

  const handleViewEvent = (event: IEventListItem) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold">
            🎉 Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              Failed to load upcoming events
            </div>
          ) : data?.data.data.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No upcoming events found
            </div>
          ) : (
            data?.data.data.map((event) => (
              <div
                key={event.id}
                className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-700">
                      {event.event_title}
                    </span>
                  </div>
                  <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleViewEvent(event)}
                  >
                    View
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap capitalize">
                  <Badge className="bg-purple-600 text-white font-medium">
                    {event.event_type}
                  </Badge>
                  <Badge className="bg-blue-600 text-white font-medium">
                    {format(new Date(event.start_date), "MMM dd, yyyy")}
                  </Badge>
                  <Badge className="bg-green-600 text-white font-medium">
                    {event.start_time}
                  </Badge>
                  <Badge className="bg-orange-600 text-white font-medium">
                    {typeof event.location === "string"
                      ? event.location
                      : typeof event.location === "object" && event.location !== null
                      ? ((event.location as unknown as Record<string, string>).address || "Location not available")
                      : "Location not available"}
                  </Badge>
                  {event.tickets.length > 0 && (
                    <Badge className="bg-cyan-600 text-white font-medium">
                      {event.tickets.length} ticket type
                      {event.tickets.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        eventType={type || null}
        eventClass={
          type === EventType.TICKET ? EventClass.EXCLUSIVE : EventClass.REGULAR
        }
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        event={selectedEvent}
      />
    </>
  );
}
