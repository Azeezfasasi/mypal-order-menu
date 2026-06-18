"use client";

import { useState } from "react";
import type { ICreateEventDto, IUpdateEventDto, INightlifeEvent } from "@/types/nightlife-types";
import { NightlifeApi } from "@/services/api/nightlife-service";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";

export default function EventsManagement() {
  const { data: eventsData, isLoading, error } = NightlifeApi.useGetEvents();
  const createEvent = NightlifeApi.useCreateEvent();
  const updateEvent = NightlifeApi.useUpdateEvent();
  const deleteEvent = NightlifeApi.useDeleteEvent();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<INightlifeEvent | null>(null);
  const [formData, setFormData] = useState<ICreateEventDto>({
    event_title: "",
    about: "",
    event_type: "ticket",
    event_class: "regular",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    duration: "",
    location: "",
    is_eighten_plus: false,
  });
  const [images, setImages] = useState<File[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkboxElement = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checkboxElement.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_title || !formData.start_date || !formData.start_time || !formData.event_type || !formData.event_class) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("🌙 [NIGHTLIFE] Submitting event form:", {
      formData,
      hasImages: images.length > 0,
      imagesCount: images.length,
    });

    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          eventData: formData as IUpdateEventDto,
          images: images.length > 0 ? images : undefined,
        });
      } else {
        await createEvent.mutateAsync({
          eventData: formData,
          images: images.length > 0 ? images : undefined,
        });
      }

      // Reset form
      setFormData({
        event_title: "",
        about: "",
        event_type: "ticket",
        event_class: "regular",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        duration: "",
        location: "",
        is_eighten_plus: false,
      });
      setImages([]);
      setEditingEvent(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      // Error is handled by the mutation's onError callback
    }
  };

  const handleEdit = (event: INightlifeEvent) => {
    setEditingEvent(event);
    setFormData({
      event_title: event.event_title,
      about: event.about,
      event_type: event.event_type,
      event_class: event.event_class,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      duration: event.duration,
      location: typeof event.location === "string"
        ? event.location
        : typeof event.location === "object" && event.location !== null
        ? ((event.location as unknown as Record<string, string>).address || "Location not available")
        : "Location not available",
      is_eighten_plus: event.is_eighten_plus,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent.mutateAsync(eventId);
      } catch (err) {
          console.error(err);
        // Error is handled by the mutation's onError callback
      }
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
    setFormData({
      event_title: "",
      about: "",
      event_type: "ticket",
      event_class: "regular",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      duration: "",
      location: "",
      is_eighten_plus: false,
    });
    setImages([]);
  };

  const events = (eventsData?.data as INightlifeEvent[]) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events Management</h2>
          <p className="text-gray-600">Create and manage your nightlife events</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            + Create Event
          </button>
        )}
      </div>

      {/* Form */}
      {isFormOpen && (
        <Card className="p-5">
          <h3 className="text-xl font-semibold mb-4">
            {editingEvent ? "Edit Event" : "Create New Event"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Event Title *</label>
              <input
                type="text"
                name="event_title"
                value={formData.event_title}
                onChange={handleInputChange}
                placeholder="e.g., VIP Night Party"
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* Event Type and Class */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Type *</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="ticket">Ticket</option>
                  <option value="reservation">Reservation</option>
                  <option value="informative">Informative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Event Class *</label>
                <select
                  name="event_class"
                  value={formData.event_class}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="regular">Regular</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">About Event *</label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                placeholder="Event description and details"
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Times (12-hour format) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time (hh:mm AM/PM) *</label>
                <input
                  type="text"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  placeholder="02:30 PM"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: hh:mm AM/PM</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Time (hh:mm AM/PM) *</label>
                <input
                  type="text"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  placeholder="11:30 PM"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: hh:mm AM/PM</p>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-1">Duration *</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 9 hours"
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Event location or venue"
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* 18+ Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_eighten_plus"
                id="is_eighten_plus"
                checked={formData.is_eighten_plus}
                onChange={handleInputChange}
                className="h-4 w-4 border border-gray-300 rounded"
              />
              <label htmlFor="is_eighten_plus" className="ml-2 text-sm font-medium">
                18+ Event
              </label>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium mb-1">Event Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {images.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">{images.length} image(s) selected</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
              >
                {createEvent.isPending || updateEvent.isPending ? "Saving..." : "Save Event"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Events List */}
      <Card className="p-5">
        {error ? (
          <ErrorHandler message="Error loading events" />
        ) : isLoading ? (
          <Loader message="Loading events" />
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No events yet. Create your first event to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-4">Your Events ({events.length})</h3>
            {events.map((event) => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{event.event_title}</h4>
                    <p className="text-gray-600 text-sm">{event.about}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📅 {event.start_date}</span>
                      <span>🕐 {event.start_time} - {event.end_time}</span>
                      <span>📍 {typeof event.location === "string"
                        ? event.location
                        : typeof event.location === "object" && event.location !== null
                        ? ((event.location as unknown as Record<string, string>).address || "Location not available")
                        : "Location not available"}</span>
                      <span className="inline-flex items-center gap-1">
                        {event.event_type === "ticket" && "🎫"}
                        {event.event_type === "reservation" && "🪑"}
                        {event.event_type === "informative" && "ℹ️"}
                        {event.event_type}
                      </span>
                      {event.is_eighten_plus && <span>🔞 18+</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {event.event_class}
                      </span>
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        {event.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
