import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import type {
  AssignRiderDto,
  CreateDeliveryRiderDto,
  CreateDeliveryZoneDto,
  DeliveryAnalytics,
  DeliveryOrder,
  DeliveryOrderFilters,
  DeliveryRider,
  DeliveryStats,
  DeliveryZone,
  UpdateDeliveryOrderStatusDto,
  UpdateDeliveryRiderDto,
  UpdateDeliveryZoneDto,
} from "@/types/delivery-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DELIVERY_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export const createDeliveryApi = () => {
  // Helper function to generate a polygon from coordinates
  // Creates a square buffer around a point or route
  const generatePolygonFromCoordinates = (
    points: Array<{ lat: number; lng: number }>,
    bufferKm: number = 0.5,
  ): Array<{ lng: number; lat: number }> => {
    if (points.length === 0) return [];

    // Convert km to degrees (approximate: 1 degree ≈ 111 km)
    const bufferDegrees = bufferKm / 111;

    if (points.length === 1) {
      // Single point: create a square
      const { lat, lng } = points[0];
      return [
        { lng: lng - bufferDegrees, lat: lat - bufferDegrees },
        { lng: lng + bufferDegrees, lat: lat - bufferDegrees },
        { lng: lng + bufferDegrees, lat: lat + bufferDegrees },
        { lng: lng - bufferDegrees, lat: lat + bufferDegrees },
      ];
    } else if (points.length === 2) {
      // Two points (pickup/dropoff): create a rectangle
      const [p1, p2] = points;
      const minLng = Math.min(p1.lng, p2.lng) - bufferDegrees;
      const maxLng = Math.max(p1.lng, p2.lng) + bufferDegrees;
      const minLat = Math.min(p1.lat, p2.lat) - bufferDegrees;
      const maxLat = Math.max(p1.lat, p2.lat) + bufferDegrees;
      return [
        { lng: minLng, lat: minLat },
        { lng: maxLng, lat: minLat },
        { lng: maxLng, lat: maxLat },
        { lng: minLng, lat: maxLat },
      ];
    } else {
      // Multiple points: create convex hull (simplified - use bounding box)
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      const minLng = Math.min(...lngs) - bufferDegrees;
      const maxLng = Math.max(...lngs) + bufferDegrees;
      const minLat = Math.min(...lats) - bufferDegrees;
      const maxLat = Math.max(...lats) + bufferDegrees;
      return [
        { lng: minLng, lat: minLat },
        { lng: maxLng, lat: minLat },
        { lng: maxLng, lat: maxLat },
        { lng: minLng, lat: maxLat },
      ];
    }
  };

  return {
    // ===== DELIVERY ZONES =====
    useGetDeliveryZones: () =>
      useQuery<BaseApiResponse<DeliveryZone[]>>({
        queryKey: DELIVERY_QUERY_KEYS.zonesList(),
        queryFn: async (): Promise<BaseApiResponse<DeliveryZone[]>> => {
          const response = await apiClient.get<Record<string, unknown>>(
            ENDPOINTS.DELIVERY.GET_ZONES,
          );
          const data = response.data as unknown as {
            data?: Array<Record<string, unknown>>;
            message?: string;
            status?: string;
            statusCode?: number;
          };
          // Transform backend response to match frontend interface
          if (data?.data && Array.isArray(data.data)) {
            data.data = data.data.map((zone: Record<string, unknown>) => {
              // Parse polygon WKT string to extract coordinates
              // Format: POLYGON((lng lat, lng lat, lng lat, lng lat))
              let latitude: number | undefined;
              let longitude: number | undefined;
              const polygonStr = zone.polygon as string;
              
              if (polygonStr && typeof polygonStr === 'string') {
                try {
                  // Extract all coordinates from POLYGON((lng lat, ...))
                  const coordMatch = polygonStr.match(/\(\(([^)]+)\)/);
                  if (coordMatch?.[1]) {
                    const coords = coordMatch[1].split(',')[0].trim().split(/\s+/);
                    if (coords.length >= 2) {
                      longitude = Number(coords[0]);
                      latitude = Number(coords[1]);
                    }
                  }
                } catch (e) {
                  console.error('Failed to parse polygon:', e);
                }
              }
              
              return {
                id: zone.id,
                business_id: zone.business_id,
                zone_name: zone.name || zone.zone_name,
                description: zone.description || '',
                delivery_fee: Number(zone.deliveryPrice ?? zone.delivery_fee ?? 0),
                estimated_delivery_time: Number(zone.estimatedDeliveryTime ?? zone.estimated_delivery_time ?? 0),
                is_active: zone.isActive === true || zone.is_active === true || true,
                coverage_area: latitude && longitude ? [longitude, latitude] : null,
                latitude: latitude ?? (zone.latitude as number | undefined),
                longitude: longitude ?? (zone.longitude as number | undefined),
                created_at: zone.created_at || zone.createdAt,
                updated_at: zone.updated_at || zone.updatedAt,
              };
            });
          }
          return data as unknown as BaseApiResponse<DeliveryZone[]>;
        },
      }),

    useGetDeliveryZone: (id: string) =>
      useQuery<BaseApiResponse<DeliveryZone>>({
        queryKey: DELIVERY_QUERY_KEYS.zone(id),
        queryFn: async (): Promise<BaseApiResponse<DeliveryZone>> => {
          const response = await apiClient.get<Record<string, unknown>>(
            ENDPOINTS.DELIVERY.GET_ZONE(id),
          );
          const data = response.data as unknown as {
            data?: Record<string, unknown>;
            message?: string;
            status?: string;
            statusCode?: number;
          };
          // Transform backend response to match frontend interface
          if (data?.data) {
            const zone = data.data as Record<string, unknown>;
            // Parse polygon WKT string to extract coordinates
            let latitude: number | undefined;
            let longitude: number | undefined;
            const polygonStr = zone.polygon as string;
            
            if (polygonStr && typeof polygonStr === 'string') {
              try {
                // Extract all coordinates from POLYGON((lng lat, ...))
                const coordMatch = polygonStr.match(/\(\(([^)]+)\)/);
                if (coordMatch?.[1]) {
                  const coords = coordMatch[1].split(',')[0].trim().split(/\s+/);
                  if (coords.length >= 2) {
                    longitude = Number(coords[0]);
                    latitude = Number(coords[1]);
                  }
                }
              } catch (e) {
                console.error('Failed to parse polygon:', e);
              }
            }
            
            data.data = {
              id: zone.id,
              business_id: zone.business_id,
              zone_name: zone.name || zone.zone_name,
              description: zone.description || '',
              delivery_fee: Number(zone.deliveryPrice ?? zone.delivery_fee ?? 0),
              estimated_delivery_time: Number(zone.estimatedDeliveryTime ?? zone.estimated_delivery_time ?? 0),
              is_active: zone.isActive === true || zone.is_active === true || true,
              coverage_area: latitude && longitude ? [longitude, latitude] : null,
              latitude: latitude ?? (zone.latitude as number | undefined),
              longitude: longitude ?? (zone.longitude as number | undefined),
              created_at: zone.created_at || zone.createdAt,
              updated_at: zone.updated_at || zone.updatedAt,
            } as unknown as Record<string, unknown>;
          }
          return data as unknown as BaseApiResponse<DeliveryZone>;
        },
        enabled: !!id,
      }),

    useCreateDeliveryZone: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<DeliveryZone>,
        CreateDeliveryZoneDto
      >({
        mutationFn: async (data) => {
          // Transform frontend format to backend format
          const transformedData: Record<string, unknown> = {
            name: data.zone_name || "Unnamed Zone",
            description: data.description,
            deliveryPrice: data.delivery_fee,
            estimatedDeliveryTime: data.estimated_delivery_time,
            coverageArea: data.coverage_area,
          };

          // Generate polygon from available coordinates
          // Priority: pickup/dropoff > zone center
          let coordinatesArray: Array<{ lng: number; lat: number }> = [];

          if (
            data.pickup_latitude &&
            data.pickup_longitude &&
            data.dropoff_latitude &&
            data.dropoff_longitude
          ) {
            // Use pickup and dropoff to create polygon
            coordinatesArray = generatePolygonFromCoordinates([
              {
                lat: data.pickup_latitude,
                lng: data.pickup_longitude,
              },
              {
                lat: data.dropoff_latitude,
                lng: data.dropoff_longitude,
              },
            ]);
          } else if (data.latitude && data.longitude) {
            // Use zone center to create polygon
            coordinatesArray = generatePolygonFromCoordinates([
              {
                lat: data.latitude,
                lng: data.longitude,
              },
            ]);
          }

          if (coordinatesArray.length >= 4) {
            transformedData.coordinates = coordinatesArray;
          } else if (coordinatesArray.length > 0) {
            // Fallback: ensure at least 4 points
            transformedData.coordinates = coordinatesArray.concat(
              Array(Math.max(0, 4 - coordinatesArray.length)).fill(
                coordinatesArray[0],
              ),
            );
          }

          const response = await apiClient.post<BaseApiResponse<DeliveryZone>>(
            ENDPOINTS.DELIVERY.CREATE_ZONE,
            transformedData,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Delivery zone created successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.zonesList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to create delivery zone";
          toast.error(message);
        },
      });
    },

    useUpdateDeliveryZone: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<DeliveryZone>,
        { id: string; data: UpdateDeliveryZoneDto }
      >({
        mutationFn: async ({ id, data }) => {
          // Transform frontend format to backend format
          const transformedData: Record<string, unknown> = {};
          if (data.zone_name) transformedData.name = data.zone_name;
          if (data.description) transformedData.description = data.description;
          if (data.delivery_fee !== undefined)
            transformedData.deliveryPrice = data.delivery_fee;
          if (data.estimated_delivery_time !== undefined)
            transformedData.estimatedDeliveryTime = data.estimated_delivery_time;
          if (data.coverage_area)
            transformedData.coverageArea = data.coverage_area;
          if (data.is_active !== undefined)
            transformedData.isActive = data.is_active;

          // Generate polygon from available coordinates
          let coordinatesArray: Array<{ lng: number; lat: number }> = [];

          if (
            data.pickup_latitude &&
            data.pickup_longitude &&
            data.dropoff_latitude &&
            data.dropoff_longitude
          ) {
            // Use pickup and dropoff to create polygon
            coordinatesArray = generatePolygonFromCoordinates([
              {
                lat: data.pickup_latitude,
                lng: data.pickup_longitude,
              },
              {
                lat: data.dropoff_latitude,
                lng: data.dropoff_longitude,
              },
            ]);
          } else if (data.latitude && data.longitude) {
            // Use zone center to create polygon
            coordinatesArray = generatePolygonFromCoordinates([
              {
                lat: data.latitude,
                lng: data.longitude,
              },
            ]);
          }

          if (coordinatesArray.length >= 4) {
            transformedData.coordinates = coordinatesArray;
          } else if (coordinatesArray.length > 0) {
            // Fallback: ensure at least 4 points
            transformedData.coordinates = coordinatesArray.concat(
              Array(Math.max(0, 4 - coordinatesArray.length)).fill(
                coordinatesArray[0],
              ),
            );
          }

          const response = await apiClient.patch<BaseApiResponse<DeliveryZone>>(
            ENDPOINTS.DELIVERY.UPDATE_ZONE(id),
            transformedData,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Delivery zone updated successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.zonesList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to update delivery zone";
          toast.error(message);
        },
      });
    },

    useDeleteDeliveryZone: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          // Use PATCH with is_active: false for soft delete since backend doesn't support DELETE
          const response = await apiClient.patch<BaseApiResponse<null>>(
            ENDPOINTS.DELIVERY.UPDATE_ZONE(id),
            { is_active: false },
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Delivery zone deleted successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.zonesList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to delete delivery zone";
          toast.error(message);
        },
      });
    },

    // ===== DELIVERY RIDERS =====
    useGetDeliveryRiders: () =>
      useQuery<BaseApiResponse<DeliveryRider[]>>({
        queryKey: DELIVERY_QUERY_KEYS.ridersList(),
        queryFn: async (): Promise<BaseApiResponse<DeliveryRider[]>> => {
          const response = await apiClient.get<Record<string, unknown>>(
            ENDPOINTS.DELIVERY.GET_RIDERS,
          );
          const data = response.data as unknown as {
            data?: Array<Record<string, unknown>>;
            message?: string;
            status?: string;
            statusCode?: number;
          };
          // Transform backend response to match frontend interface
          if (data?.data && Array.isArray(data.data)) {
            data.data = data.data.map((rider: Record<string, unknown>) => ({
              id: rider.id,
              business_id: rider.business_id,
              rider_name: rider.name || rider.rider_name,
              phone_number: rider.phone || rider.phone_number,
              email: rider.email,
              vehicle_type: (rider.vehicle_type || "bike") as "bike" | "car" | "truck",
              vehicle_plate: rider.vehicle_plate || "",
              status: ((rider.status as string) || "inactive").toLowerCase() as "active" | "inactive" | "on_delivery" | "unavailable",
              current_location: rider.currentLat && rider.currentLng 
                ? { latitude: Number(rider.currentLat), longitude: Number(rider.currentLng) }
                : undefined,
              is_verified: rider.is_verified === true,
              rating: rider.rating as number | undefined,
              total_deliveries: Number(rider.total_deliveries ?? 0),
              created_at: rider.created_at || rider.createdAt,
              updated_at: rider.updated_at || rider.updatedAt,
            }));
          }
          return data as unknown as BaseApiResponse<DeliveryRider[]>;
        },
      }),

    useGetDeliveryRider: (id: string) =>
      useQuery<BaseApiResponse<DeliveryRider>>({
        queryKey: DELIVERY_QUERY_KEYS.rider(id),
        queryFn: async (): Promise<BaseApiResponse<DeliveryRider>> => {
          const response = await apiClient.get<Record<string, unknown>>(
            ENDPOINTS.DELIVERY.GET_RIDER(id),
          );
          const data = response.data as unknown as {
            data?: Record<string, unknown>;
            message?: string;
            status?: string;
            statusCode?: number;
          };
          // Transform backend response to match frontend interface
          if (data?.data) {
            const rider = data.data as Record<string, unknown>;
            data.data = {
              id: rider.id,
              business_id: rider.business_id,
              rider_name: rider.name || rider.rider_name,
              phone_number: rider.phone || rider.phone_number,
              email: rider.email,
              vehicle_type: (rider.vehicle_type || "bike") as "bike" | "car" | "truck",
              vehicle_plate: rider.vehicle_plate || "",
              status: ((rider.status as string) || "inactive").toLowerCase() as "active" | "inactive" | "on_delivery" | "unavailable",
              current_location: rider.currentLat && rider.currentLng 
                ? { latitude: Number(rider.currentLat), longitude: Number(rider.currentLng) }
                : undefined,
              is_verified: rider.is_verified === true,
              rating: rider.rating as number | undefined,
              total_deliveries: Number(rider.total_deliveries ?? 0),
              created_at: rider.created_at || rider.createdAt,
              updated_at: rider.updated_at || rider.updatedAt,
            } as unknown as Record<string, unknown>;
          }
          return data as unknown as BaseApiResponse<DeliveryRider>;
        },
        enabled: !!id,
      }),

    useCreateDeliveryRider: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<DeliveryRider>,
        CreateDeliveryRiderDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<Record<string, unknown>>(
            ENDPOINTS.DELIVERY.CREATE_RIDER,
            data,
          );
          const result = response.data as unknown as {
            data?: Record<string, unknown>;
            message?: string;
            status?: string;
            statusCode?: number;
          };
          // Transform backend response to match frontend interface
          if (result?.data) {
            const rider = result.data as Record<string, unknown>;
            result.data = {
              id: rider.id,
              business_id: rider.business_id,
              rider_name: rider.name || rider.rider_name,
              phone_number: rider.phone || rider.phone_number,
              email: rider.email,
              vehicle_type: (rider.vehicle_type || "bike") as "bike" | "car" | "truck",
              vehicle_plate: rider.vehicle_plate || "",
              status: ((rider.status as string) || "inactive").toLowerCase() as "active" | "inactive" | "on_delivery" | "unavailable",
              current_location: rider.currentLat && rider.currentLng 
                ? { latitude: Number(rider.currentLat), longitude: Number(rider.currentLng) }
                : undefined,
              is_verified: rider.is_verified === true,
              rating: rider.rating as number | undefined,
              total_deliveries: Number(rider.total_deliveries ?? 0),
              created_at: rider.created_at || rider.createdAt,
              updated_at: rider.updated_at || rider.updatedAt,
            } as unknown as Record<string, unknown>;
          }
          return result as unknown as BaseApiResponse<DeliveryRider>;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Delivery rider added successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.ridersList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to add delivery rider";
          toast.error(message);
        },
      });
    },

    useUpdateDeliveryRider: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<DeliveryRider>,
        { id: string; data: UpdateDeliveryRiderDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch<Record<string, unknown>>(
            ENDPOINTS.DELIVERY.UPDATE_RIDER(id),
            data,
          );
          const result = response.data as unknown as {
            data?: Record<string, unknown>;
            message?: string;
            status?: string;
            statusCode?: number;
          };
          // Transform backend response to match frontend interface
          if (result?.data) {
            const rider = result.data as Record<string, unknown>;
            result.data = {
              id: rider.id,
              business_id: rider.business_id,
              rider_name: rider.name || rider.rider_name,
              phone_number: rider.phone || rider.phone_number,
              email: rider.email,
              vehicle_type: (rider.vehicle_type || "bike") as "bike" | "car" | "truck",
              vehicle_plate: rider.vehicle_plate || "",
              status: ((rider.status as string) || "inactive").toLowerCase() as "active" | "inactive" | "on_delivery" | "unavailable",
              current_location: rider.currentLat && rider.currentLng 
                ? { latitude: Number(rider.currentLat), longitude: Number(rider.currentLng) }
                : undefined,
              is_verified: rider.is_verified === true,
              rating: rider.rating as number | undefined,
              total_deliveries: Number(rider.total_deliveries ?? 0),
              created_at: rider.created_at || rider.createdAt,
              updated_at: rider.updated_at || rider.updatedAt,
            } as unknown as Record<string, unknown>;
          }
          return result as unknown as BaseApiResponse<DeliveryRider>;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Delivery rider updated successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.ridersList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to update delivery rider";
          toast.error(message);
        },
      });
    },

    useDeleteDeliveryRider: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          // Use PATCH with status: inactive for soft delete since backend doesn't support DELETE
          const response = await apiClient.patch<BaseApiResponse<null>>(
            ENDPOINTS.DELIVERY.UPDATE_RIDER(id),
            { status: "inactive" },
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Delivery rider deleted successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.ridersList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to delete delivery rider";
          toast.error(message);
        },
      });
    },

    // ===== DELIVERY ORDERS =====
    useGetDeliveryOrders: (filters?: DeliveryOrderFilters) =>
      useQuery<BaseApiResponse<DeliveryOrder[]>>({
        queryKey: DELIVERY_QUERY_KEYS.ordersList(
          filters as Record<string, unknown> | undefined,
        ),
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<DeliveryOrder[]>>(
            ENDPOINTS.DELIVERY.GET_ORDERS,
            { params: filters },
          );
          return response.data;
        },
      }),

    useGetDeliveryOrder: (id: string) =>
      useQuery<BaseApiResponse<DeliveryOrder>>({
        queryKey: DELIVERY_QUERY_KEYS.order(id),
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<DeliveryOrder>>(
            ENDPOINTS.DELIVERY.GET_ORDER(id),
          );
          return response.data;
        },
        enabled: !!id,
      }),

    useAssignRider: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<DeliveryOrder>, AssignRiderDto>({
        mutationFn: async (data) => {
          const response = await apiClient.post<BaseApiResponse<DeliveryOrder>>(
            ENDPOINTS.DELIVERY.ASSIGN_RIDER,
            data,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Rider assigned successfully");
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.ordersList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message || "Failed to assign rider";
          toast.error(message);
        },
      });
    },

    useUpdateDeliveryOrderStatus: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<DeliveryOrder>,
        { id: string; data: UpdateDeliveryOrderStatusDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch<BaseApiResponse<DeliveryOrder>>(
            ENDPOINTS.DELIVERY.UPDATE_ORDER_STATUS(id),
            data,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(
            data.message || "Delivery order status updated successfully",
          );
          queryClient.invalidateQueries({
            queryKey: DELIVERY_QUERY_KEYS.ordersList(),
          });
        },
        onError: (err) => {
          const message =
            err.response?.data?.message ||
            "Failed to update delivery order status";
          toast.error(message);
        },
      });
    },

    // ===== DELIVERY ANALYTICS =====
    useGetDeliveryAnalytics: () =>
      useQuery<BaseApiResponse<DeliveryAnalytics>>({
        queryKey: DELIVERY_QUERY_KEYS.analyticsList(),
        queryFn: async (): Promise<BaseApiResponse<DeliveryAnalytics>> => {
          const response = await apiClient.get<BaseApiResponse<DeliveryAnalytics>>(
            ENDPOINTS.DELIVERY.GET_ANALYTICS,
          );
          return response.data;
        },
      }),

    useGetDeliveryStats: () =>
      useQuery<BaseApiResponse<DeliveryStats>>({
        queryKey: DELIVERY_QUERY_KEYS.statsList(),
        queryFn: async (): Promise<BaseApiResponse<DeliveryStats>> => {
          const response = await apiClient.get<BaseApiResponse<DeliveryStats>>(
            ENDPOINTS.DELIVERY.GET_ANALYTICS_STATS,
          );
          return response.data;
        },
      }),
  };
};

export const DeliveryApi = createDeliveryApi();



