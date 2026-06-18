"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAvatarUrl } from "@/lib/avatar-utils";
import { formatDate } from "@/lib/utils";
import { EventClass } from "@/types/enums";
import { IEvent, IEventListItem } from "@/types/event-types";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  Gift,
  Hourglass,
  Mail,
  MapPin,
  MessageCircle,
  Share2,
  Ticket,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Separator } from "../ui/separator";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: IEvent | IEventListItem | null;
}

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
}: EventDetailsModalProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  if (!event) return null;

  const getStatusBadge = (status: string) => {
    return status === "Approved"
      ? "bg-green-600 text-white hover:bg-green-700"
      : "bg-red-600 text-white hover:bg-red-700";
  };

  const handleImageClick = () => {
    if (event.flyer_url) {
      const imageUrl =
        typeof event.flyer_url === "string"
          ? event.flyer_url
          : URL.createObjectURL(event.flyer_url);
      setSelectedImageUrl(imageUrl);
      setImageModalOpen(true);
    }
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(selectedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.event_title}-flyer.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handleShareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_title,
          text: "Check out this event!",
          url: selectedImageUrl,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(selectedImageUrl);
        alert("Image URL copied to clipboard!");
      } catch (error) {
        console.error("Clipboard copy failed:", error);
      }
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[95vh] md:max-h-[90svh] flex flex-col p-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-lg font-medium">
              Event details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-orange-600">
              {event.event_title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                className={getStatusBadge(
                  event.is_verified ? "Approved" : "Pending"
                )}
              >
                {event.is_verified ? "Approved" : "Pending"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 capitalize">
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">
              {event.event_class === EventClass.EXCLUSIVE
                ? "Exclusive"
                : "Regular"}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">
              {event.event_type}
            </Badge>
            {event.is_eighten_plus && (
              <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                18+
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-md text-gray-900 mb-3">
              About This Event
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {event.about}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">Organized by:</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="flex-shrink-0 h-8 w-8">
                  <AvatarImage
                    src={
                      event.business?.image_url ||
                      createAvatarUrl({
                        avatarUrl: event.business.business_name!,
                      })
                    }
                    alt={event.business.business_name!}
                  />
                  <AvatarFallback className="text-xs">
                    {event.business?.business_name
                      ?.substring(0, 1)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.business?.business_name}</p>
                  <p className="text-sm text-gray-500">
                    {event.business?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">Send message</p>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-orange-200"
                >
                  <Mail className="h-4 w-4 text-orange-600" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-green-200"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">
                  {typeof event.location === "string"
                    ? event.location
                    : typeof event.location === "object" && event.location !== null
                    ? ((event.location as unknown as Record<string, string>).address || "Location not available")
                    : "Location not available"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Event Dates</p>
                <p className="font-medium">
                  {formatDate(event.start_date)}
                  {event.end_date !== event.start_date &&
                    ` - ${formatDate(event.end_date)}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">
                  {event.start_time} - {event.end_time}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Hourglass className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{event.duration}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Adult content (18+)</p>
                <p className="font-medium">
                  {event.is_eighten_plus ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date Created</p>
                <p className="font-medium">{formatDate(event.createdAt)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Event Image */}
          {event.flyer_url && (
            <div
              className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleImageClick}
            >
              <Image
                src={
                  typeof event.flyer_url === "string"
                    ? event.flyer_url
                    : URL.createObjectURL(event.flyer_url)
                }
                alt={event.event_title}
                width={200}
                height={300}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
          )}

          {/* Tickets Section */}
          {event.tickets.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-md text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-600" />
                Tickets
              </h3>
              <div className="space-y-2">
                {event.tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.ticket_name}
                          </p>
                          <p className="text-lg font-semibold text-orange-600">
                            ₦{ticket.price.toLocaleString()}
                          </p>
                        </div>
                        {ticket?.benefits?.length > 0 && (
                          <Badge variant="outline" className="border-gray-200">
                            {ticket.benefits.length} benefit
                            {ticket.benefits.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      {ticket?.benefits?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Benefits:
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            {ticket.benefits.map((benefit) => (
                              <li
                                key={benefit.id}
                                className="text-sm text-gray-600"
                              >
                                {benefit.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Benefits Section */}
          {event.benefits?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-md text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" /> Event Benefits
              </h3>
              <div className="grid gap-2">
                {event.benefits.map((benefit) => (
                  <div key={benefit.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-md font-medium text-gray-700">
                      {benefit.title}
                    </p>
                    <p className="text-sm text-gray-700">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Agenda Section */}
          {event.agendas?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-md  text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" /> Event Agenda
              </h3>
              <div className="space-y-2">
                {event.agendas.map((agenda) => (
                  <div key={agenda.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-900">
                        {agenda.title}
                      </p>

                      <Badge variant="outline" className="capitalize">
                        {agenda.agendaType.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="font-light text-xs text-gray-900">
                      {agenda.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-6 pt-4 border-t">
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Image Modal */}
    <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
      <DialogContent
        className="max-w-2xl w-full h-screen p-0 lg:p-0 overflow-auto gbg-white"
        aria-describedby={undefined}
      >
        {/* Close Button */}
        <button
          onClick={() => setImageModalOpen(false)}
          className="absolute right-4 top-4 z-50 p-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
        >
          <X className="h-9 w-9 text-white" />
        </button>

        {/* Image Display */}
        <div className="relative w-full bg-gray-100">
          <div className="relative w-full h-auto">
            <Image
              src={selectedImageUrl}
              alt={event.event_title}
              width={800}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex gap-3 border-t bg-white">
          <Button
            onClick={handleDownloadImage}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            Download
          </Button>
          <Button
            onClick={handleShareImage}
            variant="outline"
            className="flex-1 border-gray-300 flex items-center justify-center gap-2"
          >
            <Share2 className="h-5 w-5" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
