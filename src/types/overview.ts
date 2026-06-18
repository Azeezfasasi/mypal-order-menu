import { IUser } from ".";
import { BaseApiResponse, PaginationResult } from "./api";
import { IBusiness } from "./auth-types";
import {
  ChartFrame,
  DeliveryService,
  DeliveryStatus,
  OrderMethod,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  ReservationStatus,
  TimeFrame,
} from "./enums";

// ===== BUSINESS RECORD DTO (New - matches backend) =====
export interface BusinessRecordDto {
  id: string;
  user: IUser;
  type?: PaymentType;
  status?: ReservationStatus | OrderStatus;
  amount?: number;
  order_method?: OrderMethod;
  delivery?: DeliveryService;
  createdAt: Date | string; // Backend uses Date, frontend might receive string
  details:
  | AccommodationTransactionDetails
  | TicketTransactionDetails
  | EventTicketPurchaseDetails
  | UserDealDetails
  | OrderDetails
  | ReservationDetails;
}

// ===== UPDATED ORDER TYPES =====
export type OrderDetails = {
  id: string;
  order_method: OrderMethod;
  status: OrderStatus;
  delivery_service: string | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  payment: PaymentDetails;
  delivery: {
    id: string;
    delivery_reference: string;
    delivery_id: string | null;
    delivery_price: number;
    delivery_fee_id: string;
    delivery_status: string;
    tracking_url: string | null;
    delivery_pin: string | null;
    pickup_otp: string | null;
    dropoff_otp: string | null;
    last_status_check_at: string | null;
    poll_count: number;
    next_poll_at: string | null;
    delivery_details: unknown | null;
  };
  orderitems: {
    id: string;
    quantity: number;
    amount: number;
    quantity_option_label: string;
    quantity_option_price: string;
    special_instructions: string | null;
    meal_preference: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    item: {
      id: string;
      name: string;
      price: number;
      price_per_adults: number | null;
      price_per_child: number | null;
      free_for_children_under: number | null;
      discount_price: number | null;
      image_urls: string[];
      background_image_url: string | null;
      quantityOptions: {
        label: string;
        price: number;
      }[];
      description: string;
      mealDetail: {
        dish: string;
        cuisine: string;
        mealType: string;
        servingFormat: string;
        preparationTime: string;
      };
      main_catch: string | null;
      main_catch_description: string | null;
      gate_pass: string | null;
      is_18_plus: boolean | null;
      catchy_phrase: string | null;
      item_type: string;
      average_prep_time: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
  }[];
  user: IUser;
};

export type PaymentDetails = {
  id: string;
  reference_id: string;
  amount: number;
  status: PaymentStatus;
  type: PaymentType | string; // Updated to use PaymentType enum
  createdAt: string;
};

export type Delivery = {
  id: string;
  delivery_reference?: string | null;
  delivery_id?: string | null;
  delivery_price?: number | null;
  delivery_fee_id: string;
  delivery_status: DeliveryStatus;
  order: Order;
  tracking_url?: string | null;
  delivery_pin: string | null;
  pickup_otp: string | null;
  dropoff_otp: string | null;
  delivery_details?: {
    insurance_amount: string;
    no_of_tasks: string;
    service_charge: string;
    delivery_instruction: string;
    vehicle_id: number;
  } | null;
};

export interface Order {
  id: string;
  user: IUser;
  status: OrderStatus;
  delivery: Delivery | string | null; // Delivery can be null if not applicable
  order_method: OrderMethod;
  createdAt: string;
  amount: number;
  details: OrderDetails;
}

export type OrderStatusCounts = {
  [key in OrderStatus]: number;
};

// Updated order list type to include statusCounts and use PaginationResult
export interface BusinessOrderPaginationResult
  extends PaginationResult<Order[]> {
  statusCounts: OrderStatusCounts;
}

export type BusinessOrderList = BusinessOrderPaginationResult;

export type BusinessOrderResponse = BaseApiResponse<BusinessOrderList>;

// ===== UPDATED TRANSACTION TYPES =====

// Backend supports these transaction detail types:
export interface TicketTransactionDetails {
  id: string;
  visitation_date: string;
  business_type: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AccommodationTransactionDetails {
  id: string;
  no_of_adults: number;
  no_of_children: number;
  total_individuals: number;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  fullname: string | null;
  phone_number: string | null;
  house_address: string | null;
  secondary_fullname: string | null;
  secondary_phone_number: string | null;
  secondary_house_address: string | null;
  secondary_relationship: string | null;
  business_type: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  amount: number;
}

// Additional detail types that backend supports
export interface EventTicketPurchaseDetails {
  id: string;
  // Add specific fields based on your EventTicketPurchase entity
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserDealDetails {
  id: string;
  // Add specific fields based on your Userdeal entity
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Updated base transaction interface to match backend BusinessRecordDto
interface BaseBusinessTransaction {
  id: string;
  user: IUser;
  type?: PaymentType; // Optional as per backend
  amount?: number; // Optional as per backend
  status: PaymentStatus;
  createdAt: string;
}

// Discriminated union for specific transaction types
export interface BusinessTicketTransaction extends BaseBusinessTransaction {
  type: PaymentType; // Use enum instead of string literal
  details: TicketTransactionDetails;
}

export interface BusinessAccommodationTransaction
  extends BaseBusinessTransaction {
  type: PaymentType;
  details: AccommodationTransactionDetails;
}

export interface BusinessEventTicketTransaction
  extends BaseBusinessTransaction {
  type: PaymentType;
  details: EventTicketPurchaseDetails;
}

export interface BusinessUserDealTransaction extends BaseBusinessTransaction {
  type: PaymentType;
  details: UserDealDetails;
}

export interface BusinessOrderTransaction extends BaseBusinessTransaction {
  type: PaymentType;
  details: OrderDetails;
}

// Updated main transaction type
export type BusinessTransaction =
  | BusinessTicketTransaction
  | BusinessAccommodationTransaction
  | BusinessEventTicketTransaction
  | BusinessUserDealTransaction
  | BusinessOrderTransaction;

// 1. Define the interface for the statusCounts object

export type TransactionStatusCounts = {
  [key in PaymentStatus]: number;
};

// 2. Create a new interface that extends PaginationResult
//    This new interface specifically adds 'statusCounts' to a paginated response
//    for Business Transactions.
export interface BusinessTransactionPaginationResult
  extends PaginationResult<BusinessTransaction[]> {
  statusCounts: TransactionStatusCounts;
}

// 3. Update BusinessTransactionList to use this new, extended interface
//    This means BusinessTransactionList now inherently includes statusCounts
export type BusinessTransactionList = BusinessTransactionPaginationResult;

// 4. Your BusinessTransactionResponse remains clean, as it just refers to BusinessTransactionList
export type BusinessTransactionResponse =
  BaseApiResponse<BusinessTransactionList>;

// ===== RESERVATION TYPES =====
export interface ReservationDetails {
  id: string;
  name: string;
  no_of_adults: number;
  no_of_children: number;
  total_individuals: number;
  reservation_id: string;
  experience: string;
  date: string;
  time: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: IUser;
  business: IBusiness;
}

export interface Reservation {
  id: string;
  user: IUser;
  status: ReservationStatus; // Use enum instead of string
  createdAt: string;
  details: ReservationDetails;
}

export interface ReservationStatusCounts {
  Booked: number;
  Pending: number;
  Cancelled: number;
}

// Updated to use PaginationResult generic type
// export type ReservationList = PaginationResult<Reservation[]>;
export interface BusinessReservationPaginationResult
  extends PaginationResult<Reservation[]> {
  statusCounts: ReservationStatusCounts;
}
// export interface ReservationList extends PaginationResult<Reservation[]> {}

export type BusinessReservationResponse =
  BaseApiResponse<BusinessReservationPaginationResult>;

// ===== OVERVIEW AND METRICS =====
export interface OverviewMetrics {
  totalRevenue: string;
  totalCount: number;
  countLabel: string;
  revenueLabel: string;
}

export interface RevenueData {
  period: string;
  revenue: number;
  count: number;
}

export type RevenueResponse = BaseApiResponse<RevenueData[]>;

export interface CompareRevenueData {
  current: RevenueData[];
  previous: RevenueData[];
  comparison: {
    revenue_change: number;
    count_change: number;
    revenue_percentage: number;
    count_percentage: number;
  };
}

export type CompareRevenueResponse = BaseApiResponse<CompareRevenueData>;

// ===== UI-FRIENDLY TYPES =====
export interface TransactionRow {
  id: string;
  name: string;
  avatar: string;
  ticketId: string;
  ticketType: PaymentType; // Use enum instead of string literal
  date: string;
  amount: string;
  status: string;
  transactionType?: string;
  paymentMethod: string;
  reference: string;
  details?:
  | TicketTransactionDetails
  | AccommodationTransactionDetails
  | EventTicketPurchaseDetails
  | UserDealDetails
  | OrderDetails;
}

// ===== CHART AND ANALYTICS TYPES (Based on backend methods) =====
export interface ChartData {
  [key: string]: number;
}

export type ChartResponse = BaseApiResponse<ChartData>;

// Query DTOs to match backend filters
export interface ReservationQueryDto {
  status?: ReservationStatus;
  startDate?: string; // Format: dd-MM-yy
  endDate?: string; // Format: dd-MM-yy
  timeFrame?: TimeFrame;
  page?: number;
  limit?: number;
}

export interface TransactionQueryDto {
  status?: PaymentStatus;
  startDate?: string; // Format: dd-MM-yy
  endDate?: string; // Format: dd-MM-yy
  timeFrame?: TimeFrame;
  page?: number;
  limit?: number;
}

export interface ChartQueryDto {
  chartFrame: ChartFrame;
  year?: number; // Required for QUARTERLY, SIXMONTH, YEARLY
  startDate?: string; // Format: dd-MM-yy (for compare date methods)
  endDate?: string; // Format: dd-MM-yy (for compare date methods)
}
