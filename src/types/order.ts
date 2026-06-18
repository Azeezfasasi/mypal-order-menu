export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Picked Up" | "Delivered";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  customerPreference?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  orderDate: Date;
  customer: Customer;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  prepTime: number; // in minutes
  riderArrivalTime: number; // in minutes
  createdAt: Date;
  mealPhoto?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  status: OrderStatus;
  timestamp: Date;
  isCurrentStatus: boolean;
}

export interface LiveOverviewStats {
  activeOrders: number;
  newOrders: number;
  ridersIncoming: number;
  ridersETA: string;
  completedToday: number;
  completionRate: number;
  delayedOrders: number;
}
