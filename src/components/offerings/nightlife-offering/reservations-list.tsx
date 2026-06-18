"use client";

import { useState } from "react";
import type { INightlifeReservation, IUpdateReservationDto } from "@/types/nightlife-types";
import { NightlifeApi } from "@/services/api/nightlife-service";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";

export default function ReservationsList() {
  const { data: reservationsData, isLoading, error } = NightlifeApi.useGetReservations();
  const updateReservation = NightlifeApi.useUpdateReservation();
  const deleteReservation = NightlifeApi.useDeleteReservation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<IUpdateReservationDto>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const reservations = (reservationsData?.data as INightlifeReservation[]) || [];

  const filteredReservations =
    filterStatus === "all"
      ? reservations
      : reservations.filter((r) => r.status === filterStatus);

  const handleEditClick = (reservation: INightlifeReservation) => {
    setEditingId(reservation.id);
    setEditFormData({
      guestName: reservation.guestName,
      email: reservation.email,
      phone: reservation.phone,
      partySize: reservation.partySize,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      status: reservation.status,
    });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === "partySize" ? Number(value) : value,
    }));
  };

  const handleSaveEdit = async (reservationId: string) => {
    // Validate required fields
    if (!editFormData.guestName || !editFormData.email || !editFormData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateReservation.mutateAsync({
        id: reservationId,
        data: editFormData,
      });
      toast.success("Reservation updated successfully!");
      setEditingId(null);
    } catch (err) {
        console.error(err);
      // Error is handled by mutation's onError
    }
  };

  const handleDelete = async (reservationId: string) => {
    if (confirm("Are you sure you want to delete this reservation?")) {
      try {
        await deleteReservation.mutateAsync(reservationId);
        toast.success("Reservation deleted successfully!");
      } catch (err) {
          console.error(err);
        // Error is handled by mutation's onError
      }
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getReservationTypeColor = (type: string) => {
    return type === "bar" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Reservations</h2>
        <p className="text-gray-600">Manage bar and lounge reservations</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "confirmed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded capitalize ${
              filterStatus === status
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {status === "all" ? "All Reservations" : status}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      <Card className="p-5">
        {error ? (
          <ErrorHandler message="Error loading reservations" />
        ) : isLoading ? (
          <Loader message="Loading reservations" />
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No reservations found for the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Guest Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Date & Time</th>
                  <th className="text-left px-4 py-3 font-semibold">Party Size</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {editingId === reservation.id ? (
                      <>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getReservationTypeColor(reservation.type)}`}>
                            {reservation.type.charAt(0).toUpperCase() + reservation.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            name="guestName"
                            value={editFormData.guestName || ""}
                            onChange={handleEditInputChange}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <input
                              type="email"
                              name="email"
                              value={editFormData.email || ""}
                              onChange={handleEditInputChange}
                              className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                              placeholder="Email"
                            />
                            <input
                              type="tel"
                              name="phone"
                              value={editFormData.phone || ""}
                              onChange={handleEditInputChange}
                              className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                              placeholder="Phone"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <input
                              type="date"
                              name="reservationDate"
                              value={editFormData.reservationDate || ""}
                              onChange={handleEditInputChange}
                              className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                            />
                            <input
                              type="time"
                              name="reservationTime"
                              value={editFormData.reservationTime || ""}
                              onChange={handleEditInputChange}
                              className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            name="partySize"
                            value={editFormData.partySize || ""}
                            onChange={handleEditInputChange}
                            className="border border-gray-300 rounded px-2 py-1 w-20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            name="status"
                            value={editFormData.status || ""}
                            onChange={handleEditInputChange}
                            className="border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            onClick={() => handleSaveEdit(reservation.id)}
                            disabled={updateReservation.isPending}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getReservationTypeColor(reservation.type)}`}>
                            {reservation.type.charAt(0).toUpperCase() + reservation.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{reservation.guestName}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>{reservation.email}</div>
                          <div className="text-gray-500">{reservation.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>{reservation.reservationDate}</div>
                          <div className="text-gray-500">{reservation.reservationTime}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{reservation.partySize}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}
                          >
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            onClick={() => handleEditClick(reservation)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(reservation.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      {filteredReservations.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {filteredReservations.filter((r) => r.status === "confirmed").length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {filteredReservations.filter((r) => r.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {filteredReservations.filter((r) => r.status === "cancelled").length}
              </div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
