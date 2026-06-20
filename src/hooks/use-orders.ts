"use client"

import { useState, useEffect, useCallback } from "react";
import ordersApi, { OrderFilter, OrderStats, Order } from "@/services/api/orders";

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useOrders = (filters?: OrderFilter): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ordersApi.getOrders(filters);
        
        // Handle different response formats - API returns nested data.data
        const ordersList = response.data?.data || response.data?.orders || response.orders || response || [];
        if (isMounted) {
          setOrders(Array.isArray(ordersList) ? ordersList : []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch orders";
        if (isMounted) {
          setError(message);
        }
        console.error("useOrders error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getOrders(filters);
      const ordersList = response.data?.data || response.data?.orders || response.orders || response || [];
      setOrders(Array.isArray(ordersList) ? ordersList : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(message);
      console.error("useOrders error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, refetch };
};

interface UseOrderStatsResult {
  stats: OrderStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useOrderStats = (branchId?: string): UseOrderStatsResult => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ordersApi.getOrderStats(branchId);
        if (isMounted) {
          setStats(response);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch order stats";
        if (isMounted) {
          setError(message);
        }
        console.error("useOrderStats error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getOrderStats(branchId);
      setStats(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch order stats";
      setError(message);
      console.error("useOrderStats error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch };
};

interface UseActiveOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useActiveOrders = (branchId?: string): UseActiveOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ordersApi.getActiveOrders(branchId);
        
        const ordersList = response.data?.data || response.data?.orders || response.orders || response || [];
        if (isMounted) {
          setOrders(Array.isArray(ordersList) ? ordersList : []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch active orders";
        if (isMounted) {
          setError(message);
        }
        console.error("useActiveOrders error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchActiveOrders();
    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getActiveOrders(branchId);
      const ordersList = response.data?.data || response.data?.orders || response.orders || response || [];
      setOrders(Array.isArray(ordersList) ? ordersList : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch active orders";
      setError(message);
      console.error("useActiveOrders error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, refetch };
};

interface UseOrderByIdResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useOrderById = (orderId: string | null): UseOrderByIdResult => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await ordersApi.getOrderById(orderId);
        
        const orderData = response.data || response;
        if (isMounted) {
          setOrder(orderData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch order";
        if (isMounted) {
          setError(message);
        }
        console.error("useOrderById error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const refetch = async () => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getOrderById(orderId);
      const orderData = response.data || response;
      setOrder(orderData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch order";
      setError(message);
      console.error("useOrderById error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { order, loading, error, refetch };
};

// Hook for updating order status
export const useUpdateOrderStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (orderId: string, status: "PROCESSING" | "READY" | "CANCELLED") => {
      try {
        setLoading(true);
        setError(null);
        const response = await ordersApi.updateOrderStatus(orderId, status);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update order status";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateStatus, loading, error };
};

// Hook for uploading meal photo
export const useUploadMealPhoto = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (orderId: string, photoUrl: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.uploadMealPhoto(orderId, photoUrl);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload photo";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadPhoto, loading, error };
};

// Hook for notifying customer
export const useNotifyCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notify = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.notifyCustomer(orderId);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to notify customer";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { notify, loading, error };
};
