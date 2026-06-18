// Delivery Types and Interfaces

export interface DeliveryZone {
  id: string;
  business_id: string;
  zone_name: string;
  description?: string;
  delivery_fee: number;
  estimated_delivery_time: number; // in minutes
  is_active: boolean;
  coverage_area?: string;
  latitude?: number;
  longitude?: number;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryZoneDto {
  zone_name: string;
  description?: string;
  delivery_fee: number;
  estimated_delivery_time: number;
  coverage_area?: string;
  latitude?: number;
  longitude?: number;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
}

export interface UpdateDeliveryZoneDto {
  zone_name?: string;
  description?: string;
  delivery_fee?: number;
  estimated_delivery_time?: number;
  coverage_area?: string;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
}

export interface DeliveryRider {
  id: string;
  business_id: string;
  rider_name: string;
  phone_number: string;
  email?: string;
  vehicle_type: "bike" | "car" | "truck";
  vehicle_plate?: string;
  status: "active" | "inactive" | "on_delivery" | "unavailable";
  current_location?: {
    latitude: number;
    longitude: number;
  };
  is_verified: boolean;
  rating?: number;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryRiderDto {
  name: string;
  phone: string;
  email?: string;
  vehicle_type: "bike" | "car" | "truck";
  vehicle_plate?: string;
}

export interface UpdateDeliveryRiderDto {
  name?: string;
  phone?: string;
  email?: string;
  vehicle_type?: "bike" | "car" | "truck";
  vehicle_plate?: string;
  status?: "active" | "inactive" | "on_delivery" | "unavailable";
}

export interface DeliveryOrderUser {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface DeliveryOrderBusiness {
  id: string;
  businessName: string;
}

export interface DeliveryOrderAddress {
  id: string;
  address: string;
  lat?: number;
  long?: number;
}

export interface DeliveryOrderDetail {
  id: string;
  user: DeliveryOrderUser;
  business: DeliveryOrderBusiness;
  address: DeliveryOrderAddress;
  amount: number;
  order_method: string;
  status: string;
}

export interface DeliveryOrderZone {
  id: string;
  name: string;
  deliveryPrice: number;
}

export interface DeliveryOrderRider {
  id: string;
  displayId: string;
  name: string;
  phone: string;
  status: string;
}

export interface DeliveryOrder {
  id: string;
  order: DeliveryOrderDetail;
  zone: DeliveryOrderZone;
  rider?: DeliveryOrderRider;
  deliveryPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignRiderDto {
  order_id: string;
  rider_id: string;
}

export interface UpdateDeliveryOrderStatusDto {
  status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  notes?: string;
}

export interface DeliveryOrderFilters {
  status?: string;
  zone_id?: string;
  rider_id?: string;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

// Delivery Analytics Types
export interface DeliveryByMonth {
  month: string;
  count: number;
}

export interface DeliveryByZone {
  zone: string;
  zoneId: string;
  count: number;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  revenue: number;
  activeZones: number;
  pendingOrders: number;
  totalRiders: number;
  activeRiders: number;
  deliveriesByMonth: DeliveryByMonth[];
  deliveriesByZone: DeliveryByZone[];
}

export interface DeliveryStats {
  deliveries: DeliveryOrder[];
  zones: DeliveryZone[];
  orders: DeliveryOrder[];
  riders: DeliveryRider[];
  stats: {
    totalDeliveries: number;
    deliveredCount: number;
    pendingCount: number;
    inTransitCount: number;
    cancelledCount: number;
  };
}
