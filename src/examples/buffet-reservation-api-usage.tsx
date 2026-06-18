// Example Usage: Buffet Reservation API

import {
  BuffetReservationApi,
  calculateBuffetReservationTotal,
} from "@/services/api/buffet-reservation-api";
import type {
  IBuffetReservationQueryOptions,
  ICreateBuffetReservationDto,
} from "@/types/buffet-reservation-types";
import { ReservationStatus } from "@/types/enums";
import { useState } from "react";

// ==================================
// Example 1: Creating a Buffet Reservation
// ==================================

export const CreateBuffetReservationExample = () => {
  const reservationData: ICreateBuffetReservationDto = {
    business_id: "business-id-123",
    date: "25-07-2025", // dd-MM-YYYY format
    time: "07:00 PM", // hh:mm a format
    no_of_adults: 2,
    no_of_children: 1,
    buffet_meal: {
      id: "meal-category-id",
      quantity_adults: 2,
      quantity_children: 1,
    },
    special_offer_items: [
      { id: "special-item-1", quantity: 2 },
      { id: "special-item-2", quantity: 1 },
    ],
    other_items: [{ id: "addon-item-1", quantity: 1 }],
  };

  const createReservationMutation =
    BuffetReservationApi.useCreateBuffetReservation();

  const handleCreateReservation = async () => {
    try {
      const result = await createReservationMutation.mutateAsync(
        reservationData
      );

      // Result contains payment initialization data
      console.log("Payment Reference:", result.data.reference);
      console.log("Authorization URL:", result.data.authorization_url);

      // Redirect user to payment page
      window.location.href = result.data.authorization_url;
    } catch (error) {
      console.error("Failed to create reservation:", error);
    }
  };

  return (
    <div>
      <h2>Create Buffet Reservation</h2>
      <button
        onClick={handleCreateReservation}
        disabled={createReservationMutation.isPending}
      >
        {createReservationMutation.isPending
          ? "Creating..."
          : "Create Reservation"}
      </button>
    </div>
  );
};

// ==================================
// Example 2: Verifying Payment
// ==================================

export const VerifyPaymentExample = () => {
  const [referenceId, setReferenceId] = useState("");
  const verifyPaymentMutation = BuffetReservationApi.useVerifyBuffetPayment();

  const handleVerifyPayment = async () => {
    if (!referenceId) return;

    try {
      const result = await verifyPaymentMutation.mutateAsync({
        referenceId,
        maxRetries: 3, // Optional: defaults to 3
      });

      console.log("Payment verified:", result.data);
      console.log("Reservation confirmed:", result.data.payment);
    } catch (error) {
      console.error("Payment verification failed:", error);
    }
  };

  return (
    <div>
      <h2>Verify Payment</h2>
      <input
        type="text"
        value={referenceId}
        onChange={(e) => setReferenceId(e.target.value)}
        placeholder="Enter payment reference"
      />
      <button
        onClick={handleVerifyPayment}
        disabled={verifyPaymentMutation.isPending}
      >
        {verifyPaymentMutation.isPending ? "Verifying..." : "Verify Payment"}
      </button>
    </div>
  );
};

// ==================================
// Example 3: Fetching Business Reservations
// ==================================

export const BusinessReservationsExample = () => {
  const [queryParams, setQueryParams] =
    useState<IBuffetReservationQueryOptions>({
      page: 1,
      limit: 10,
      status: ReservationStatus.PENDING,
    });

  const {
    data: reservationsResponse,
    isLoading,
    error,
  } = BuffetReservationApi.useGetBusinessReservations(queryParams);

  const reservations = reservationsResponse?.data?.data || [];
  const totalCount = reservationsResponse?.data?.total || 0;

  const handleStatusFilter = (status: ReservationStatus | undefined) => {
    setQueryParams((prev) => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  if (isLoading) return <div>Loading reservations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Business Buffet Reservations</h2>

      {/* Status Filters */}
      <div>
        <button onClick={() => handleStatusFilter(undefined)}>All</button>
        <button onClick={() => handleStatusFilter(ReservationStatus.PENDING)}>
          Pending
        </button>
        <button onClick={() => handleStatusFilter(ReservationStatus.BOOKED)}>
          Booked
        </button>
        <button onClick={() => handleStatusFilter(ReservationStatus.CANCELLED)}>
          Cancelled
        </button>
      </div>

      {/* Reservations List */}
      <div>
        <p>Total Reservations: {totalCount}</p>
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            style={{
              border: "1px solid #ccc",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h3>Reservation #{reservation.id.slice(0, 8)}</h3>
            <p>
              Customer: {reservation.user.firstname} {reservation.user.lastname}
            </p>
            <p>
              Date: {reservation.date} at {reservation.time}
            </p>
            <p>
              Guests: {reservation.total_individuals} (
              {reservation.no_of_adults} adults, {reservation.no_of_children}{" "}
              children)
            </p>
            <p>Meal Type: {reservation.meal_type}</p>
            <p>Amount: ₦{reservation.payment.amount.toLocaleString()}</p>
            <p>Status: {reservation.payment.status}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div>
        <button
          onClick={() => handlePageChange(queryParams.page! - 1)}
          disabled={queryParams.page === 1}
        >
          Previous
        </button>
        <span>Page {queryParams.page}</span>
        <button
          onClick={() => handlePageChange(queryParams.page! + 1)}
          disabled={reservations.length < queryParams.limit!}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ==================================
// Example 4: Fetching Single Reservation
// ==================================

export const SingleReservationExample = ({
  reservationId,
}: {
  reservationId: string;
}) => {
  const {
    data: reservationResponse,
    isLoading,
    error,
  } = BuffetReservationApi.useGetReservation(reservationId);

  const reservation = reservationResponse?.data;

  if (isLoading) return <div>Loading reservation details...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!reservation) return <div>Reservation not found</div>;

  return (
    <div>
      <h2>Reservation Details</h2>
      <div>
        <h3>Customer Information</h3>
        <p>
          Name: {reservation.user.firstname} {reservation.user.lastname}
        </p>
        <p>Email: {reservation.user.email}</p>
        <p>Phone: {reservation.user.phone_number}</p>
      </div>

      <div>
        <h3>Reservation Details</h3>
        <p>Date: {reservation.date}</p>
        <p>Time: {reservation.time}</p>
        <p>Adults: {reservation.no_of_adults}</p>
        <p>Children: {reservation.no_of_children}</p>
        <p>Total Guests: {reservation.total_individuals}</p>
        <p>Meal Type: {reservation.meal_type}</p>
      </div>

      <div>
        <h3>Buffet Meal</h3>
        {reservation.buffetMeal && (
          <div>
            <p>Category: {reservation.buffetMeal.name}</p>
            <p>Adults: {reservation.buffetMealWithQuantity.quantity_adults}</p>
            <p>
              Children: {reservation.buffetMealWithQuantity.quantity_children}
            </p>
          </div>
        )}
      </div>

      <div>
        <h3>Special Offers</h3>
        {reservation.specialOfferItemsWithQuantities.map((item, index) => (
          <div key={index}>
            <p>
              {item.item.name} - Quantity: {item.quantity} - Price: ₦
              {item.item.price}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3>Other Items</h3>
        {reservation.otherItemsWithQuantities.map((item, index) => (
          <div key={index}>
            <p>
              {item.item.name} - Quantity: {item.quantity} - Price: ₦
              {item.item.price}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3>Payment Information</h3>
        <p>Amount: ₦{reservation.payment.amount.toLocaleString()}</p>
        <p>Reference: {reservation.payment.reference}</p>
        <p>Status: {reservation.payment.status}</p>
      </div>
    </div>
  );
};

// ==================================
// Example 5: Utility Functions Usage
// ==================================

export const UtilityFunctionsExample = () => {
  const reservationData: ICreateBuffetReservationDto = {
    business_id: "business-123",
    date: "25-07-2025",
    time: "07:00 PM",
    no_of_adults: 2,
    no_of_children: 1,
    buffet_meal: {
      id: "meal-1",
      quantity_adults: 2,
      quantity_children: 1,
    },
    special_offer_items: [{ id: "special-1", quantity: 2 }],
  };

  // Example price data (usually fetched from service categories/items API)
  const priceData = {
    buffetMealPrices: { adult: 5000, child: 3000 },
    specialOfferPrices: { "special-1": 2000 },
    otherItemPrices: {},
  };

  // Calculate estimated total (client-side estimation)
  const estimatedTotal = calculateBuffetReservationTotal(
    reservationData,
    priceData
  );

  return (
    <div>
      <h2>Utility Functions Example</h2>
      <p>Estimated Total: ₦{estimatedTotal.toLocaleString()}</p>
      <small>Note: Final amount is calculated on the server</small>
    </div>
  );
};

// ==================================
// Complete Component Example
// ==================================

export const BuffetReservationManagement = () => {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab("list")}>Reservations List</button>
        <button onClick={() => setActiveTab("create")}>
          Create Reservation
        </button>
        <button onClick={() => setActiveTab("verify")}>Verify Payment</button>
      </nav>

      {activeTab === "list" && <BusinessReservationsExample />}
      {activeTab === "create" && <CreateBuffetReservationExample />}
      {activeTab === "verify" && <VerifyPaymentExample />}
    </div>
  );
};
