"use client";

import { useState } from "react";
import type { INightlifeReservation, IUpdateReservationDto } from "@/types/nightlife-types";
import { NightlifeApi } from "@/services/api/nightlife-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { AlertCircle, CheckCircle, Clock, Edit, Trash2 } from "lucide-react";

export default function ReservationsManagement() {
  const { data: reservationsData, isLoading, error, refetch } = NightlifeApi.useGetReservations();
  const updateReservation = NightlifeApi.useUpdateReservation();
  const deleteReservation = NightlifeApi.useDeleteReservation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<IUpdateReservationDto>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const reservations = (reservationsData?.data as INightlifeReservation[]) || [];

  // Filter reservations by status and type
  const filteredReservations = reservations.filter((r) => {
    const statusMatch = filterStatus === "all" || r.status === filterStatus;
    const typeMatch = filterType === "all" || r.type === filterType;
    return statusMatch && typeMatch;
  });

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
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditFormData({});
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
      handleCloseEditModal();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (reservationId: string) => {
    if (confirm("Are you sure you want to delete this reservation?")) {
      try {
        await deleteReservation.mutateAsync(reservationId);
        toast.success("Reservation deleted successfully!");
        refetch();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
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

  // Calculate statistics
  const totalReservations = filteredReservations.length;
  const confirmedCount = filteredReservations.filter((r) => r.status === "confirmed").length;
  const pendingCount = filteredReservations.filter((r) => r.status === "pending").length;
  const barCount = reservations.filter((r) => r.type === "bar").length;
  const loungeCount = reservations.filter((r) => r.type === "lounge").length;

  return (
    <Card className="px-4 py-5 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Bar & Lounge Reservations</h2>
        <p className="text-gray-600">Manage all bar and lounge reservations in one place</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 md:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Reservations</p>
            <p className="text-2xl font-bold">{totalReservations}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Bar / Lounge</p>
            <p className="text-2xl font-bold">{barCount} / {loungeCount}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "confirmed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded capitalize text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {status === "all" ? "All Statuses" : status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <div className="flex gap-2 flex-wrap">
              {["all", "bar", "lounge"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded capitalize text-sm font-medium transition-colors ${
                    filterType === type
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {type === "all" ? "All Types" : type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <Card className="p-5">
        {error ? (
          <ErrorHandler message="Error loading reservations" />
        ) : isLoading ? (
          <Loader message="Loading reservations" />
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">No reservations found</p>
            <p className="text-sm">
              {reservations.length === 0
                ? "Start by creating your first bar or lounge reservation"
                : "No reservations match the selected filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-sm">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-sm">Guest Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-sm">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-sm">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-sm">Time</th>
                  <th className="text-center px-4 py-3 font-semibold text-sm">Party Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-sm">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getReservationTypeColor(reservation.type)}`}
                      >
                        {reservation.type.charAt(0).toUpperCase() +
                          reservation.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{reservation.guestName}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{reservation.email}</div>
                      <div className="text-gray-600 text-xs">{reservation.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{reservation.reservationDate}</td>
                    <td className="px-4 py-3 text-sm">{reservation.reservationTime}</td>
                    <td className="px-4 py-3 text-center font-medium text-sm">
                      {reservation.partySize}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reservation.status)}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}
                        >
                          {reservation.status.charAt(0).toUpperCase() +
                            reservation.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Button
                        onClick={() => handleEditClick(reservation)}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(reservation.id)}
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Export and Additional Actions */}
      {filteredReservations.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <div className="flex gap-2">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Export to CSV
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              Print Report
            </Button>
          </div>
        </Card>
      )}

      {/* Edit Reservation Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Guest Name */}
            <div>
              <Label htmlFor="guestName">Guest Name *</Label>
              <Input
                id="guestName"
                type="text"
                name="guestName"
                value={editFormData.guestName || ""}
                onChange={handleEditInputChange}
                placeholder="Enter guest name"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={editFormData.email || ""}
                onChange={handleEditInputChange}
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={editFormData.phone || ""}
                onChange={handleEditInputChange}
                placeholder="Enter phone number"
              />
            </div>

            {/* Reservation Date */}
            <div>
              <Label htmlFor="reservationDate">Reservation Date</Label>
              <Input
                id="reservationDate"
                type="date"
                name="reservationDate"
                value={editFormData.reservationDate || ""}
                onChange={handleEditInputChange}
              />
            </div>

            {/* Reservation Time */}
            <div>
              <Label htmlFor="reservationTime">Reservation Time</Label>
              <Input
                id="reservationTime"
                type="time"
                name="reservationTime"
                value={editFormData.reservationTime || ""}
                onChange={handleEditInputChange}
              />
            </div>

            {/* Party Size */}
            <div>
              <Label htmlFor="partySize">Party Size</Label>
              <Input
                id="partySize"
                type="number"
                name="partySize"
                min="1"
                value={editFormData.partySize || ""}
                onChange={handleEditInputChange}
                placeholder="Number of guests"
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={editFormData.status || ""}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={updateReservation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => editingId && handleSaveEdit(editingId)}
              disabled={updateReservation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {updateReservation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
