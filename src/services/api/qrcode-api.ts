import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { toast } from "sonner";

export interface QRCodeScanRequest {
  qrData: string;
  pin: string;
}

export interface QRCodeScanResponse {
  success: boolean;
  data: {
    id: string;
    ticketId: string;
    accountName: string;
    userName: string;
    amount: number;
    status: string;
    expiresAt?: string;
  };
  message: string;
}

export interface QRScanHistoryItem {
  id: string;
  referenceId: string;
  referenceType: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
  status: string;
  isVerified: boolean;
  createdAt: string;
  expiresAt: string;
  lastVerifiedAt?: string;
  failedAttempts: number;
}

export interface QRScanHistoryResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    data: QRScanHistoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export const QRCodeApi = {
  // Scan QR code and verify it
  useScanQRCode: () => {
    return useMutation({
      mutationFn: async (request: QRCodeScanRequest) => {
        const response = await apiClient.post<QRCodeScanResponse>(
          ENDPOINTS.QRCODE.SCAN,
          request
        );
        return response.data;
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to scan QR code";
        toast.error(errorMessage);
      },
    });
  },

  // Get business scan history
  useGetScanHistory: (params?: { page?: number; limit?: number }) => {
    return useQuery({
      queryKey: ["qrcode-scan-history", params],
      queryFn: async () => {
        const response = await apiClient.get<QRScanHistoryResponse>(
          ENDPOINTS.QRCODE.GET_SCAN_HISTORY,
          {
            params,
          }
        );
        return response.data;
      },
    });
  },

  // Get QR code status
  useGetQRCodeStatus: (id: string) => {
    return useQuery({
      queryKey: ["qrcode-status", id],
      queryFn: async () => {
        const response = await apiClient.get<{
          success: boolean;
          data: {
            id: string;
            status: string;
            expiresAt?: string;
            scansCount: number;
          };
        }>(ENDPOINTS.QRCODE.GET_STATUS(id));
        return response.data;
      },
      enabled: !!id,
    });
  },

  // Get user's QR codes
  useGetMyQRCodes: (params?: { page?: number; limit?: number }) => {
    return useQuery({
      queryKey: ["my-qrcodes", params],
      queryFn: async () => {
        const response = await apiClient.get<{
          success: boolean;
          data: {
            id: string;
            qrCodeData: string;
            ticketId: string;
            status: string;
            createdAt: string;
            expiresAt?: string;
          }[];
          total: number;
        }>(ENDPOINTS.QRCODE.GET_MY_QRS, {
          params,
        });
        return response.data;
      },
    });
  },

  // Regenerate expired/locked QR code
  useRegenerateQRCode: () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await apiClient.post<{
          success: boolean;
          data: {
            id: string;
            qrCodeData: string;
            expiresAt: string;
          };
        }>(ENDPOINTS.QRCODE.REGENERATE(id), {});
        return response.data;
      },
      onSuccess: () => {
        toast.success("QR code regenerated successfully");
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to regenerate QR code";
        toast.error(errorMessage);
      },
    });
  },
};
