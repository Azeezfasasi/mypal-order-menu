"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClubApi } from "@/services/api/club-api";
import type { CreateClubReservationDto, ClubReservation } from "@/services/api/club-api";
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

const formatDateToDDMMYYYY = (date: string): string => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const convertToDateInput = (ddMmYyyyDate: string): string => {
  if (!ddMmYyyyDate) return "";
  const [day, month, year] = ddMmYyyyDate.split("-");
  return `${year}-${month}-${day}`;
};

const formatTimeToHHMMA = (time: string): string => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minutes} ${ampm}`;
};

export default function ClubReservationsSection() {
  const { business } = useAuthStore();
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateClubReservationDto>({
    number_of_individuals: 1,
    visitation_date: "",
    visitation_time: "",
    business_id: business?.id || "",
    ticket_type_id: "",
    guest_size_id: "",
  });

  const { data: reservations, isLoading, refetch } = ClubApi.useGetReservations();
  const { mutate: createReservation, isPending: isCreatingPending } =
    ClubApi.useCreateReservation();
  const { mutate: verifyPayment, isPending: isVerifyingPayment } =
    ClubApi.useVerifyReservationPayment();

  const handleCreate = () => {
    if (
      !formData.number_of_individuals ||
      !formData.visitation_date ||
      !formData.visitation_time ||
      !formData.ticket_type_id ||
      !formData.guest_size_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    createReservation(formData, {
      onSuccess: () => {
        setFormData({
          number_of_individuals: 1,
          visitation_date: "",
          visitation_time: "",
          business_id: business?.id || "",
          ticket_type_id: "",
          guest_size_id: "",
        });
        setIsCreating(false);
      },
    });
  };

  const handleVerifyPayment = (referenceId: string, reservationId: string) => {
    setVerifyingId(reservationId);
    verifyPayment(referenceId, {
      onSuccess: () => {
        setVerifyingId(null);
        refetch();
      },
      onError: () => {
        setVerifyingId(null);
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string | number) => {
    const statusStr = String(status).toLowerCase();
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1";
    
    if (statusStr === "completed" || statusStr === "1" || statusStr === "paid") {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (statusStr === "pending" || statusStr === "0") {
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    } else if (statusStr === "failed" || statusStr === "2") {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  const getPaymentStatusLabel = (status: string | number) => {
    const statusStr = String(status).toLowerCase();
    if (statusStr === "1" || statusStr === "completed" || statusStr === "paid") return "Paid";
    if (statusStr === "0" || statusStr === "pending") return "Pending";
    if (statusStr === "2" || statusStr === "failed") return "Failed";
    return String(status);
  };

  if (isLoading) {
    return (
      <Card className="mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto">
      <CardHeader className="flex-row items-center justify-between mb-4">
        <div>
          <h3 className="text-xl md:text-md font-bold font-sora flex items-center gap-3 text-primary-500">
            <Calendar className="h-5 w-5" />
            Club Reservations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage club visitor reservations and verify payments
          </p>
        </div>

        {/* {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
        )} */}
      </CardHeader>

      <CardContent>
        {isCreating ? (
          <div className="space-y-4 border-b pb-6 mb-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900">Create New Reservation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Individuals *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number_of_individuals || 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_of_individuals: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visitation Date *
                </label>
                <input
                  type="date"
                  value={convertToDateInput(formData.visitation_date || "")}
                  onChange={(e) => {
                    const formatted = formatDateToDDMMYYYY(e.target.value);
                    setFormData({ ...formData, visitation_date: formatted });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visitation Time *
                </label>
                <input
                  type="time"
                  value={formData.visitation_time || ""}
                  onChange={(e) => {
                    const formatted = formatTimeToHHMMA(e.target.value);
                    setFormData({ ...formData, visitation_time: formatted });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Type ID *
                </label>
                <input
                  type="text"
                  value={formData.ticket_type_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ticket_type_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123e4567-e89b-12d3-a456-426614174000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Size ID *
                </label>
                <input
                  type="text"
                  value={formData.guest_size_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_size_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123e4567-e89b-12d3-a456-426614174000"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleCreate}
                disabled={isCreatingPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {isCreatingPending ? "Creating..." : "Create Reservation"}
              </Button>
              <Button
                onClick={() => setIsCreating(false)}
                variant="outline"
                className="border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {/* Reservations List */}
        {reservations && reservations.length > 0 ? (
          <div className="space-y-3">
            {reservations.map((reservation: ClubReservation) => (
              <div
                key={reservation.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">
                        {reservation.type || "Club Reservation"} | Ref: {reservation.reservation_id?.slice(-8)}
                      </h4>
                      <span className={getStatusBadge(reservation.status)}>
                        {getStatusIcon(reservation.status)}
                        {String(reservation.status).charAt(0).toUpperCase() +
                          String(reservation.status).slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ID: {reservation.id}</p>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === reservation.id ? null : reservation.id)
                    }
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedId === reservation.id ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Main Info - Always Visible */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600 text-xs font-medium">Entry Time</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {reservation.entry_time}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600 text-xs font-medium">Guests</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {reservation.no_of_guests}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600 text-xs font-medium">Amount</p>
                    <p className="font-semibold text-gray-900">₦{reservation.amount?.toLocaleString() || "0"}</p>
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600 text-xs font-medium">Payment</p>
                    <span className={getStatusBadge(reservation.payment_status)}>
                      {getPaymentStatusLabel(reservation.payment_status)}
                    </span>
                  </div>
                </div>

                {/* Payment Action */}
                {String(reservation.payment_status) === "0" || String(reservation.payment_status).toLowerCase() === "pending" ? (
                  <div className="mb-3">
                    <Button
                      onClick={() => handleVerifyPayment(reservation.reservation_id, reservation.id)}
                      disabled={verifyingId === reservation.id || isVerifyingPayment}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      {verifyingId === reservation.id ? "Verifying..." : "Verify Payment"}
                    </Button>
                  </div>
                ) : null}

                {/* Expanded Details */}
                {expandedId === reservation.id && (
                  <div className="border-t pt-3 mt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600 font-medium">Created At</p>
                        <p className="text-gray-900">{reservation.createdAt}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Reservation ID</p>
                        <p className="text-gray-900 font-mono">{reservation.reservation_id}</p>
                      </div>
                    </div>

                    {/* Business Info */}
                    {reservation.business && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-gray-700 font-medium text-sm mb-2">Business Info</p>
                        <div className="text-xs space-y-1">
                          {Object.entries(reservation.business).map(([key, value]) => (
                            <p key={key} className="text-gray-700">
                              <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Info */}
                    {reservation.user && (
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-gray-700 font-medium text-sm mb-2">User Info</p>
                        <div className="text-xs space-y-1">
                          {Object.entries(reservation.user).map(([key, value]) => (
                            <p key={key} className="text-gray-700">
                              <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : isCreating ? null : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No reservations yet</p>
            {/* <Button
              onClick={() => setIsCreating(true)}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Reservation
            </Button> */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
