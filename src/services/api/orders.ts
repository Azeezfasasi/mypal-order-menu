import { apiClient } from "@/services/api/api-client";

export interface OrderFilter {
  status?: string;
  branch_id?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  search?: string;
  startDate?: string;
  endDate?: string;
  timeFrame?: "thisWeek" | "thisMonth" | "lastMonth";
}

export interface OrderStats {
  activeOrders: number;
  newOrders: number;
  ridersIncoming: number;
  ridersETA: string;
  completedToday: number;
  completionRate: number;
  delayedOrders: number;
}

export interface OrderItem {
  name: string;
  [key: string]: unknown;
}

export interface OrderCustomer {
  name: string;
  address?: string;
  [key: string]: unknown;
}

export interface TimelineEvent {
  status: string;
  timestamp: Date;
  isCurrentStatus?: boolean;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  orderNumber: string | number;
  status: "pending" | "processing" | "ready" | "completed" | "cancelled";
  items?: OrderItem[];
  customer?: OrderCustomer;
  prepTime?: number;
  riderArrivalTime?: number;
  timeline?: TimelineEvent[];
  [key: string]: unknown;
}

export const ordersApi = {
  /**
   * Get list of orders with filters
   * GET /v1/business/orders
   */
  getOrders: async (filters: OrderFilter = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.order) params.append("order", filters.order);
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.branch_id) params.append("branch_id", filters.branch_id);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.timeFrame) params.append("timeFrame", filters.timeFrame);

      const response = await apiClient.get("/business/orders", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  /**
   * Get order statistics for dashboard
   * GET /v1/business/orders/stats
   */
  getOrderStats: async (branchId?: string): Promise<OrderStats> => {
    try {
      const params = branchId ? { branch_id: branchId } : {};
      const response = await apiClient.get("/business/orders/stats", { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching order stats:", error);
      throw error;
    }
  },

  /**
   * Get scheduled orders (future orders)
   * GET /v1/business/orders/scheduled
   */
  getScheduledOrders: async (branchId?: string) => {
    try {
      const params = branchId ? { branch_id: branchId } : {};
      const response = await apiClient.get("/business/orders/scheduled", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching scheduled orders:", error);
      throw error;
    }
  },

  /**
   * Get active orders (immediate + scheduled that are due now)
   * GET /v1/business/orders/active
   */
  getActiveOrders: async (branchId?: string) => {
    try {
      const params = branchId ? { branch_id: branchId } : {};
      const response = await apiClient.get("/business/orders/active", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching active orders:", error);
      throw error;
    }
  },

  /**
   * Get single order by ID
   * GET /v1/business/order/{id}
   */
  getOrderById: async (orderId: string) => {
    try {
      const response = await apiClient.get(`/business/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Update order status
   * PATCH /v1/business/order/{id}
   */
  updateOrderStatus: async (orderId: string, status: "PROCESSING" | "READY" | "CANCELLED") => {
    try {
      const response = await apiClient.patch(`/business/order/${orderId}`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },

  /**
   * Upload meal verification photo
   * POST /v1/business/order/{id}/meal-photo
   */
  uploadMealPhoto: async (orderId: string, photoUrl: string) => {
    try {
      const response = await apiClient.post(`/business/order/${orderId}/meal-photo`, {
        photo_url: photoUrl,
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading meal photo for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Notify customer that their meal is ready
   * POST /v1/business/order/{id}/notify-customer
   */
  notifyCustomer: async (orderId: string) => {
    try {
      const response = await apiClient.post(`/business/order/${orderId}/notify-customer`);
      return response.data;
    } catch (error) {
      console.error(`Error notifying customer for order ${orderId}:`, error);
      throw error;
    }
  },
};

export default ordersApi;
