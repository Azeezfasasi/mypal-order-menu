"use client"

import { useState, useEffect, useCallback } from "react";
import { OrderStatus } from "@/types/enums";
import ordersApi, { OrderFilter, OrderStats, Order } from "@/services/api/orders";

const unwrapData = (value: any): any => {
  if (value == null) return value;
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value.data !== undefined) return unwrapData(value.data);
  return value;
};

const extractArrayPayload = (payload: any): any => {
  if (Array.isArray(payload)) return payload;
  if (payload == null || typeof payload !== "object") return payload;

  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.data)) return payload.data;

  const arrayFields = Object.entries(payload).filter(([, value]) => Array.isArray(value));
  if (arrayFields.length === 1) return arrayFields[0][1];

  return payload;
};

const normalizeOrder = (rawOrder: any): Order => {
  const source = unwrapData(rawOrder);
  const details = source?.details ?? {};
  const user = source?.user ?? details?.user;
  const orderItems = Array.isArray(details?.orderitems)
    ? details.orderitems
    : Array.isArray(source?.orderitems)
    ? source.orderitems
    : Array.isArray(source?.items)
    ? source.items
    : [];

  const items = orderItems.map((item: any) => {
    const nested = item?.item ?? item;
    return {
      id: String(item?.id ?? nested?.id ?? ""),
      name: String(nested?.name ?? item?.name ?? "Unknown item"),
      quantity: Number(item?.quantity ?? 1),
      price: typeof item?.amount === "number" ? item.amount : Number(item?.amount ?? nested?.price ?? 0),
      customerPreference: String(item?.meal_preference ?? ""),
      optionLabel: String(item?.quantity_option_label ?? nested?.quantityOptions?.[0]?.label ?? ""),
      imageUrl: Array.isArray(nested?.image_urls) ? nested.image_urls[0] : nested?.background_image_url || null,
    };
  });

  const customer = user
    ? {
        id: String(user.id ?? ""),
        firstName: String(user.firstname ?? user.first_name ?? user.name ?? ""),
        lastName: String(user.lastname ?? user.last_name ?? ""),
        name: [user.firstname ?? user.first_name ?? user.name, user.lastname ?? user.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || String(user.name ?? "Unknown"),
        phone: String(user.phone_number ?? user.phone ?? "N/A"),
        address: String(user.address ?? user.formatted_address ?? "N/A"),
        city: String(user.city ?? ""),
        state: String(user.state ?? ""),
      }
    : undefined;

  return {
    ...source,
    id: String(source?.id ?? source?.details?.id ?? ""),
    orderNumber: source?.orderNumber ?? source?.id ?? source?.details?.id ?? "",
    status: String(source?.status ?? details?.status ?? "processing").toLowerCase() as any,
    items,
    customer,
    prepTime: Number(details?.preparation_time_minutes ?? source?.preparation_time_minutes ?? details?.prepTime ?? source?.prepTime ?? 0),
    riderArrivalTime: Number(details?.rider_arrival_time ?? source?.rider_arrival_time ?? source?.riderArrivalTime ?? 0),
    totalPrice: Number(details?.amount ?? source?.totalPrice ?? source?.amount ?? 0),
    createdAt: source?.createdAt ? new Date(source.createdAt) : source?.createdAt,
    orderDate: source?.orderDate ?? source?.createdAt ?? details?.createdAt,
    timeline: Array.isArray(details?.timeline) ? details.timeline : Array.isArray(source?.timeline) ? source.timeline : [],
    firstName: user?.firstname ?? user?.first_name ?? user?.name ?? "Unknown",
    lastName: user?.lastname ?? user?.last_name ?? "",
  };
};

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const getOrdersFromResponse = (response: any): Order[] => {
  const payload = extractArrayPayload(unwrapData(response));
  return Array.isArray(payload) ? payload.map(normalizeOrder) : [];
};

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

        if (isMounted) {
          setOrders(getOrdersFromResponse(response));
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
      setOrders(getOrdersFromResponse(response));
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

export const useActiveOrders = (branchId?: string | string[]): UseActiveOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const branchIds = Array.isArray(branchId)
          ? branchId.filter(Boolean)
          : branchId
          ? [branchId]
          : [];

        console.log("useActiveOrders start, branchIds:", branchIds);

        let normalizedOrders: Order[] = [];

        for (const id of branchIds) {
          console.log("useActiveOrders trying branchId:", id);
          const response = await ordersApi.getActiveOrders(id);
          console.log("useActiveOrders response for id", id, response);
          normalizedOrders = getOrdersFromResponse(response);
          console.log("useActiveOrders normalized orders for id", id, normalizedOrders);
          if (normalizedOrders.length > 0) {
            break;
          }
        }

        if (normalizedOrders.length === 0) {
          console.log("useActiveOrders fallback to no branchId");
          const response = await ordersApi.getActiveOrders();
          console.log("useActiveOrders fallback response:", response);
          normalizedOrders = getOrdersFromResponse(response);
          console.log("useActiveOrders fallback normalized orders:", normalizedOrders);
        }

        if (isMounted) {
          setOrders(normalizedOrders);
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
      const resolvedBranchId = Array.isArray(branchId) ? branchId[0] : branchId;
      const response = await ordersApi.getActiveOrders(resolvedBranchId);
      setOrders(getOrdersFromResponse(response));
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
        
        const orderData = unwrapData(response) ?? null;
        const normalizedOrder = orderData ? normalizeOrder(orderData) : null;
        if (isMounted) {
          setOrder(normalizedOrder);
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
      const orderData = unwrapData(response) ?? null;
      const normalizedOrder = orderData ? normalizeOrder(orderData) : null;
      setOrder(normalizedOrder);
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
    async (orderId: string, status: OrderStatus) => {
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
