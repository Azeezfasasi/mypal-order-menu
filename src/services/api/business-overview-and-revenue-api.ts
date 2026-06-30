// src/services/api/business-api.ts
import { validateDateRange } from "@/lib/api-helpers";
import {
  BuffetFilterType,
  ChartFrame,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  ReservationStatus,
  TimeFrame,
} from "@/types/enums";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

import {
  IBusinessErrorResponse,
  IBusinessSuccessResponse,
  PaginationResult,
} from "@/types/api";
import type {
  BusinessOrderPaginationResult,
  BusinessTransaction,
  Order,
  Reservation,
} from "@/types/overview";
import {
  BusinessOrderResponse,
  BusinessRecordDto,
  BusinessReservationPaginationResult,
  BusinessReservationResponse,
  BusinessTransactionList,
  BusinessTransactionResponse,
  ChartQueryDto,
  CompareRevenueData,
  CompareRevenueResponse,
  RevenueData,
  RevenueResponse,
} from "@/types/overview";
import { toast } from "sonner";
import { BUSINESS_OVERVIEW_QUERY_KEYS } from "../query-keys";

// Normalize unknown errors to Error with a stable message
function getError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as Record<string, any> | null;

    const message =
      e?.response?.data?.message ??
      e?.data?.message ??
      e?.message ??
      "An unexpected error occurred";

    console.log("Extracted error message:", message);
    return new Error(String(message));
  } catch {
    console.log("Extracted error message:");
    return new Error("An unexpected error occurred");
  }
}

// ============= QUERY PARAMETER TYPES =============
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string; // Format: dd-MM-yy (for compare date methods)
  endDate?: string; // Format: dd-MM-yy (for compare date methods)
  timeFrame?: TimeFrame;
  chartFrame?: ChartFrame;
  year?: number; // Required for QUARTERLY, SIXMONTH, YEARLY
  type?: BuffetFilterType;
  meal_type?: string;
  apartment_type?: string;
}

export interface GetBusinessOrderResponse {
  statusCode: number;
  status: string;
  message: string;
  data: {
    id: string;
    order_method: string;
    status: string;
    delivery_service: string;
    amount: number;

    pickup_time: string | null;
    covers: number | null;
    reservation_time: string | null;

    requested_delivery_time: string | null;
    estimated_ready_time: string | null;
    actual_ready_time: string | null;

    preparation_time_minutes: number;
    prep_notification_sent_at: string | null;

    createdAt: string;
    updatedAt: string;

    orderitems: {
      id: string;
      quantity: number;
      amount: number;
      quantity_option_label: string | null;
      quantity_option_price: string;
      item: {
        id: string;
        name: string;
        price: number;
        discount_price: string;
        image_urls: string[];
      };
    }[];

    // business: any;

    payment: {
      id: string;
      reference_id: string;
      amount: number;
      status: string;
      type: string;
      createdAt: string;
    };

    delivery: {
      id: string;
      delivery_reference: string | null;
      delivery_id: string | null;
      delivery_price: number;
      delivery_fee_id: string;
      delivery_status: string;
      tracking_url: string | null;
      pickup_otp: string | null;
      dropoff_otp: string | null;
    };

    address: {
      id: string;
      long: number;
      lat: number;
      address: string;
      full_name: string;
      phone_number: string;
      state: string;
      city: string;
      notes: string;
    };
  };
}

export interface ReservationQueryParams extends BaseQueryParams {
  status?: ReservationStatus;
  [key: string]: unknown; // Index signature to allow additional properties
}

export interface OrderQueryParams extends BaseQueryParams {
  status?: OrderStatus;
  // Additional parameters specific to orders
  [key: string]: unknown; // Index signature to allow additional properties
}

export interface TransactionQueryParams extends BaseQueryParams {
  status?: PaymentStatus;
  [key: string]: unknown; // Index signature to allow additional properties
}

export interface RevenueQueryParams {
  chartFrame?: ChartFrame;
  startDate?: string;
  endDate?: string;
  year?: number;
}

// ============= API FUNCTIONS =============
const createBusinessOverviewAndRevenueApi = () => {
  return {
    // ============= RESERVATIONS =============
    useGetBusinessReservations: <TData = BusinessReservationPaginationResult>(
      params?: ReservationQueryParams,
      options?: Omit<
        UseQueryOptions<
          BusinessReservationPaginationResult,
          IBusinessErrorResponse,
          TData
        >,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<
        BusinessReservationPaginationResult,
        IBusinessErrorResponse,
        TData
      >({
        queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.reservationsList(params),
        queryFn: async () => {
          try {
            const queryString = buildBusinessRansackQuery(
              params || ({} as Record<string, unknown>),
            );

            const response = await apiClient.get<BusinessReservationResponse>(
              `${ENDPOINTS.BUSINESS.RESERVATIONS}?${queryString}`,
            );
            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching business reservations:", err);
            throw err;
          }
        },

        // staleTime: 5 * 60 * 1000,
        ...options,
      });
    },

    useGetBusinessReservationRevenues: <
      TData = RevenueData[] | CompareRevenueData,
    >(
      params: RevenueQueryParams,
      options?: Omit<
        UseQueryOptions<
          RevenueData[] | CompareRevenueData,
          IBusinessErrorResponse,
          TData
        >,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<
        RevenueData[] | CompareRevenueData,
        IBusinessErrorResponse,
        TData
      >({
        queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.reservationRevenues(params),
        queryFn: async () => {
          try {
            const queryParams: ChartQueryDto = {
              chartFrame: params.chartFrame!,
              startDate: params.startDate,
              endDate: params.endDate,
              year: params.year,
            };

            const response = await apiClient.get<
              RevenueResponse | CompareRevenueResponse
            >(ENDPOINTS.BUSINESS.RESERVATION_REVENUES, { params: queryParams });
            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching reservation revenues:", err);
            throw err;
          }
        },
        enabled: !!params.chartFrame,

        ...options,
      });
    },

    /**
     * Update reservation status
     * @param id Reservation ID
     * @param status Accept/decline object
     */
    useUpdateReservationStatus: () => {
      const queryClient = useQueryClient();

      return useMutation<
        IBusinessSuccessResponse<Reservation>,
        Error,
        { id: string; status: { accept: boolean; decline: boolean } }
      >({
        mutationFn: async (variables: {
          id: string;
          status: { accept: boolean; decline: boolean };
        }) => {
          const { id, status } = variables;
          const response = await apiClient.patch(
            ENDPOINTS.BUSINESS.RESERVATIONS_STATUS_UPDATE(id),
            status,
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          const statusText = variables.status.accept ? "accepted" : "declined";
          toast.success(`Reservation ${statusText} successfully`);

          queryClient.invalidateQueries({
            queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.reservations(),
          });
        },
        onError: (error) => {
          const err = getError(error);
          toast.error(
            "Failed to update reservation status. Please try again.",
            {
              description: err.message,
            },
          );
        },
      });
    },

    // ============= TRANSACTIONS =============
    useGetBusinessTransactions: <TData = BusinessTransactionList>(
      params?: TransactionQueryParams,
      options?: Omit<
        UseQueryOptions<BusinessTransactionList, IBusinessErrorResponse, TData>,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<BusinessTransactionList, IBusinessErrorResponse, TData>({
        queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.transactionsList(params),
        queryFn: async () => {
          try {
            const queryString = buildBusinessRansackQuery(
              params || ({} as Record<string, unknown>),
            );

            const response = await apiClient.get<BusinessTransactionResponse>(
              `${ENDPOINTS.BUSINESS.TRANSACTIONS}?${queryString}`,
            );
            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching business transactions:", err);
            throw err;
          }
        },

        // staleTime: 5 * 60 * 1000,
        ...options,
      });
    },

    useGetBusinessTransactionRevenues: <
      TData = RevenueData[] | CompareRevenueData,
    >(
      params: RevenueQueryParams,
      options?: Omit<
        UseQueryOptions<
          RevenueData[] | CompareRevenueData,
          IBusinessErrorResponse,
          TData
        >,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<
        RevenueData[] | CompareRevenueData,
        IBusinessErrorResponse,
        TData
      >({
        queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.transactionRevenues(params),
        queryFn: async () => {
          try {
            const queryParams: ChartQueryDto = {
              chartFrame: params.chartFrame!,
              startDate: params.startDate,
              endDate: params.endDate,
              year: params.year,
            };

            const response = await apiClient.get<
              RevenueResponse | CompareRevenueResponse
            >(ENDPOINTS.BUSINESS.TRANSACTION_REVENUES, { params: queryParams });
            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching transaction revenues:", err);
            throw err;
          }
        },
        enabled: !!params.chartFrame,
        ...options,
      });
    },

    // ============= ORDERS =============
    useGetBusinessOrders: <TData = BusinessOrderPaginationResult>(
      params?: OrderQueryParams,
      options?: Omit<
        UseQueryOptions<
          BusinessOrderPaginationResult,
          IBusinessErrorResponse,
          TData
        >,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<
        BusinessOrderPaginationResult,
        IBusinessErrorResponse,
        TData
      >({
        queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.ordersList(params),
        queryFn: async () => {
          try {
            const queryString = buildBusinessRansackQuery(
              params || ({} as Record<string, unknown>),
            );

            const response = await apiClient.get<BusinessOrderResponse>(
              `${ENDPOINTS.BUSINESS.ORDERS}?${queryString}`,
            );

            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching business orders:", err);
            throw err;
          }
        },
        staleTime: 1 * 60 * 1000,
        ...options,
      });
    },

    useGetBusinessOrderDetails: ({id, category}: {id: string; category: string}) =>
      useQuery<GetBusinessOrderResponse>({
        queryKey: ['business-overview', 'orders', category, id],
        queryFn: async () => {
          const response = await apiClient.get<GetBusinessOrderResponse>(
            ENDPOINTS.BUSINESS.SINGLE_ORDER(id)
          );
          return response.data;
        },
        enabled: false
      }),

    useGetBusinessOrderRevenues: <TData = RevenueData[] | CompareRevenueData>(
      params: RevenueQueryParams,
      options?: Omit<
        UseQueryOptions<
          RevenueData[] | CompareRevenueData,
          IBusinessErrorResponse,
          TData
        >,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<
        RevenueData[] | CompareRevenueData,
        IBusinessErrorResponse,
        TData
      >({
        queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.orderRevenues(params),
        queryFn: async () => {
          try {
            const queryParams: ChartQueryDto = {
              chartFrame: params.chartFrame!,
              startDate: params.startDate,
              endDate: params.endDate,
              year: params.year,
            };

            const response = await apiClient.get<
              RevenueResponse | CompareRevenueResponse
            >(ENDPOINTS.BUSINESS.ORDER_REVENUES, { params: queryParams });
            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching order revenues:", err);
            throw err;
          }
        },
        enabled: !!params.chartFrame,

        ...options,
      });
    },

    /**
     * Update order status
     * @param id Order ID
     * @param status New status (OrderStatus)
     */
    useUpdateOrderStatus: () => {
      const queryClient = useQueryClient();

      return useMutation<
        IBusinessSuccessResponse<Order>,
        Error,
        { id: string; status: OrderStatus }
      >({
        mutationFn: async (variables: { id: string; status: OrderStatus }) => {
          const { id, status } = variables;
          const response = await apiClient.patch(
            ENDPOINTS.BUSINESS.ORDER_STATUS_UPDATE(id),
            {},
            { params: { status } },
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          const formattedStatus = variables.status
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          toast.success(
            `Order status updated to ${formattedStatus} successfully`,
            {
              description: data.message,
            },
          );

          queryClient.invalidateQueries({
            queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.orders(),
          });

          queryClient.invalidateQueries({
            queryKey: BUSINESS_OVERVIEW_QUERY_KEYS.orderRevenues(),
          });
        },
        onError: (error) => {
          const err = getError(error);
          toast.error("Failed to update order status. Please try again.", {
            description: err.message,
          });
        },
      });
    },

    // ============= GENERIC BUSINESS RECORDS (NEW) =============
    /**
     * Get business records with unified interface
     * Supports all business record types (transactions, reservations, orders, etc.)
     */
    useGetBusinessRecords: <TData = PaginationResult<BusinessRecordDto[]>>(
      params?: {
        type?: PaymentType;
        status?: ReservationStatus | OrderStatus | PaymentStatus;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      },
      options?: Omit<
        UseQueryOptions<
          PaginationResult<BusinessRecordDto[]>,
          IBusinessErrorResponse,
          TData
        >,
        "queryKey" | "queryFn"
      >,
    ) => {
      return useQuery<
        PaginationResult<BusinessRecordDto[]>,
        IBusinessErrorResponse,
        TData
      >({
        queryKey: ["business-records", params],
        queryFn: async () => {
          try {
            const response = await apiClient.get<{
              status: string;
              statusCode: number;
              message: string;
              data: PaginationResult<BusinessRecordDto[]>;
            }>("/business/records", { params });
            return response.data.data;
          } catch (error) {
            const err = getError(error);
            console.error("Error fetching business records:", err);
            throw err;
          }
        },

        // staleTime: 5 * 60 * 1000,
        ...options,
      });
    },
  };
};

// Helper function to build ransack queries for business endpoints
export const buildBusinessRansackQuery = <T extends Record<string, unknown>>(
  params: T,
) => {
  // Validate date range parameters if they exist
  if (params?.startDate && params?.endDate && params?.timeFrame) {
    validateDateRange(
      params.startDate as string,
      params.endDate as string,
      params.timeFrame as string,
    );
  }

  // Create query object that matches backend DTO expectations
  const queryObj: Record<string, unknown> = {};

  // Direct mapping to backend DTO fields - no ransack suffixes
  if (params.status) queryObj.status = params.status;
  if (params.search) queryObj.search = params.search; // Changed from 's' to 'search'

  // Date filtering - use exact format expected by backend (DD-MM-YY)
  if (params.startDate) queryObj.startDate = params.startDate;
  if (params.endDate) queryObj.endDate = params.endDate;

  // Time frame filtering
  if (params.timeFrame) queryObj.timeFrame = params.timeFrame;

  // Type filtering for orders/reservations
  if (params.type) queryObj.type = params.type;
  if (params.meal_type) queryObj.meal_type = params.meal_type;
  if (params.apartment_type) queryObj.apartment_type = params.apartment_type;

  // Analytics parameters
  if (params.chartFrame) queryObj.chartFrame = params.chartFrame;
  if (params.year) queryObj.year = params.year;

  // Pagination parameters
  if (params.page !== undefined) queryObj.page = params.page;
  if (params.limit !== undefined) queryObj.limit = params.limit;

  // Add any additional custom parameters that aren't in our known list
  Object.keys(params).forEach((key) => {
    if (
      ![
        "status",
        "search",
        "startDate",
        "endDate",
        "timeFrame",
        "type",
        "meal_type",
        "apartment_type",
        "chartFrame",
        "year",
        "page",
        "limit",
      ].includes(key)
    ) {
      queryObj[key] = params[key];
    }
  });

  // Convert to URL search params without ransack wrapper
  const searchParams = new URLSearchParams();

  Object.entries(queryObj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

export const BusinessOverviewAndRevenueApi =
  createBusinessOverviewAndRevenueApi();

// ============= TYPE GUARDS =============
export const isTicketTransaction = (
  transaction: BusinessTransaction,
): transaction is BusinessTransaction & { type: PaymentType } => {
  return transaction.type === PaymentType.TICKET;
};

export const isAccommodationTransaction = (
  transaction: BusinessTransaction,
): transaction is BusinessTransaction & { type: PaymentType } => {
  return transaction.type === PaymentType.ACCOMMODATION;
};

// ============= UPDATED USAGE EXAMPLES =============
/*
// Example usage in a React component with updated types:

import { 
  BusinessOverviewAndRevenueApi, 
  ReservationStatus, 
  OrderStatus, 
  PaymentStatus,
  PaymentType
} from '@/services/api/business-api';

function BusinessTransactions() {
  const { data: transactions } = BusinessOverviewAndRevenueApi.useGetBusinessTransactions({
    status: PaymentStatus.SUCCESS, // Updated to use PaymentStatus
    timeFrame: 'THISMONTH' // Updated to match backend format
  });

  const { data: revenues } = BusinessOverviewAndRevenueApi.useGetBusinessTransactionRevenues({
    chartFrame: 'MONTHLY', // Updated to match backend format
    year: 2024
  });

  return (
    <div>
      <h2>Business Transactions</h2>
      {transactions?.data.map(transaction => (
        <div key={transaction.id}>
          <p>Transaction ID: {transaction.id}</p>
          <p>Customer: {transaction.user.firstname} {transaction.user.lastname}</p>
          <p>Amount: ${transaction.amount}</p>
          <p>Type: {transaction.type}</p>
          <p>Status: {transaction.status}</p>
          <p>Created: {new Date(transaction.createdAt).toLocaleDateString()}</p>
          
          {transaction.type === PaymentType.TICKET && (
            <div>
              <p>Visitation Date: {transaction.details.visitation_date}</p>
              <p>Business Type: {transaction.details.business_type}</p>
            </div>
          )}
          
          {transaction.type === PaymentType.ACCOMMODATION && (
            <div>
              <p>Check-in: {transaction.details.check_in_date} at {transaction.details.check_in_time}</p>
              <p>Check-out: {transaction.details.check_out_date} at {transaction.details.check_out_time}</p>
              <p>Adults: {transaction.details.no_of_adults}</p>
              <p>Children: {transaction.details.no_of_children}</p>
              <p>Total: {transaction.details.total_individuals}</p>
              {transaction.details.fullname && <p>Guest: {transaction.details.fullname}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BusinessReservations() {
  const { data: reservations } = BusinessOverviewAndRevenueApi.useGetBusinessReservations({
    status: ReservationStatus.PENDING,
    page: 0,
    limit: 10
  });

  const updateReservationMutation = BusinessOverviewAndRevenueApi.useUpdateReservationStatus();

  const handleAcceptReservation = (reservationId: string) => {
    updateReservationMutation.mutate({
      id: reservationId,
      status: { accept: true, decline: false }
    });
  };

  return (
    <div>
      <h2>Business Reservations</h2>
      {reservations?.data.map(reservation => (
        <div key={reservation.id}>
          <p>Reservation ID: {reservation.id}</p>
          <p>Customer: {reservation.user.firstname} {reservation.user.lastname}</p>
          <p>Status: {reservation.status}</p>
          <p>Date: {reservation.details.date}</p>
          <p>Time: {reservation.details.time}</p>
          <p>Adults: {reservation.details.no_of_adults}</p>
          <p>Children: {reservation.details.no_of_children}</p>
          <p>Experience: {reservation.details.experience}</p>
          
          {reservation.status === ReservationStatus.PENDING && (
            <div>
              <button onClick={() => handleAcceptReservation(reservation.id)}>
                Accept
              </button>
              <button onClick={() => updateReservationMutation.mutate({
                id: reservation.id,
                status: { accept: false, decline: true }
              })}>
                Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BusinessRevenues() {
  const { data: transactionRevenues } = BusinessOverviewAndRevenueApi.useGetBusinessTransactionRevenues({
    chartFrame: 'MONTHLY',
    year: 2024
  });

  const { data: reservationRevenues } = BusinessOverviewAndRevenueApi.useGetBusinessReservationRevenues({
    chartFrame: 'WEEKLY',
    startDate: '01-01-24',
    endDate: '31-01-24'
  });

  return (
    <div>
      <h2>Business Revenues</h2>
      <div>
        <h3>Transaction Revenues</h3>
        {Array.isArray(transactionRevenues) ? (
          transactionRevenues.map((revenue, index) => (
            <div key={index}>
              <p>Period: {revenue.period}</p>
              <p>Revenue: ${revenue.revenue}</p>
              <p>Count: {revenue.count}</p>
            </div>
          ))
        ) : (
          transactionRevenues && (
            <div>
              <p>Revenue Change: {transactionRevenues.comparison.revenue_percentage}%</p>
              <p>Count Change: {transactionRevenues.comparison.count_percentage}%</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
*/
