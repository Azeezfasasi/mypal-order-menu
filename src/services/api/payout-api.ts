import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ====== Type Definitions ======
export interface BankAccount {
  id: string;
  bank_name: string;
  bank_code?: string;
  account_name: string;
  account_number: string;
  is_primary: boolean;
}

export interface BankAccountsResponse {
  accounts: BankAccount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
}

export interface EstimatedPayout {
  estimated_amount: number;
  is_eligible: boolean;
}

export interface PayoutConfig {
  frequency: string;
  minimum_payout: number;
}

export interface Settlement {
  id: string;
  settlement_id: string;
  date: string;
  total: number;
  gross_amount: number;
  status: "paid" | "failed" | "processing";
}

export interface SimulationPrepareResponse {
  wallet: number;
  next_payout_at: string;
  payout_enabled: boolean;
}

export interface SimulationProcessResponse {
  status: "failed" | "success" | "processing";
  reason?: string;
  settlement_id: string;
}

export interface CreateBankAccountRequest {
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
}

export interface UpdatePayoutConfigRequest {
  frequency: string;
}

// ====== Query Keys ======
const PAYOUT_QUERY_KEYS = {
  bankAccounts: () => ["bankAccounts"],
  banks: () => ["banks"],
  estimated: () => ["estimatedPayout"],
  config: () => ["payoutConfig"],
  settlements: () => ["settlements"],
};

// ====== Payout API Factory ======
const createPayoutApi = () => {
  return {
    // ====== Bank Accounts ======
    useCreateBankAccount: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<BankAccount>,
        CreateBankAccountRequest
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<BaseApiResponse<BankAccount>>(
            ENDPOINTS.PAYOUTS.BANK_ACCOUNTS.CREATE,
            data
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Bank account added successfully");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.bankAccounts(),
          });
        },
        onError: (error) => {
          console.error("Failed to add bank account:", error);
        },
      });
    },

    useGetBankAccounts: () =>
      useQuery<BaseApiResponse<BankAccountsResponse>>({
        queryKey: PAYOUT_QUERY_KEYS.bankAccounts(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<BankAccountsResponse>
          >(ENDPOINTS.PAYOUTS.BANK_ACCOUNTS.GET_ALL);
          return response.data;
        },
      }),

    useSetPrimaryBankAccount: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<{ id: string; is_primary: boolean }>, string>({
        mutationFn: async (accountId) => {
          const response = await apiClient.patch<
            BaseApiResponse<{ id: string; is_primary: boolean }>
          >(ENDPOINTS.PAYOUTS.BANK_ACCOUNTS.SET_PRIMARY(accountId));
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Primary account updated successfully");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.bankAccounts(),
          });
        },
        onError: (error) => {
          console.error("Failed to set primary account:", error);
        },
      });
    },

    useUpdateBankAccount: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<BankAccount>, { id: string; data: CreateBankAccountRequest }>({
        mutationFn: async ({ id, data }) => {

          const payload = {
            business_bank_name: data.bank_name,
            bank_code: data.bank_code,
            business_acc_name: data.account_name,
            business_acc_number: data.account_number
          }

          const response = await apiClient.patch<BaseApiResponse<BankAccount>>(
            ENDPOINTS.BUSINESS.UPDATE_BANK,
            { ...payload, id }
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Bank account updated successfully");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.bankAccounts(),
          });
        },
        onError: (error) => {
          console.error("Failed to update bank account:", error);
        },
      });
    },

    // ====== Banks ======
    useGetAllBanks: () =>
      useQuery<BaseApiResponse<Bank[]>>({
        queryKey: PAYOUT_QUERY_KEYS.banks(),
        queryFn: async () => {
          try {
            const response = await apiClient.get<BaseApiResponse<Bank[]>>(
              ENDPOINTS.PAYOUTS.BANKS
            );
            console.log("Banks API Response:", response.data);
            return response.data;
          } catch (error) {
            console.error("Error fetching banks:", error);
            throw error;
          }
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        retry: 2,
      }),

    // ====== Estimated Payout ======
    useGetEstimatedPayout: () =>
      useQuery<BaseApiResponse<EstimatedPayout>>({
        queryKey: PAYOUT_QUERY_KEYS.estimated(),
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<EstimatedPayout>>(
            ENDPOINTS.PAYOUTS.ESTIMATED
          );
          return response.data;
        },
      }),

    // ====== Payout Config ======
    useGetPayoutConfig: () =>
      useQuery<BaseApiResponse<PayoutConfig>>({
        queryKey: PAYOUT_QUERY_KEYS.config(),
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<PayoutConfig>>(
            ENDPOINTS.PAYOUTS.PAYOUT_CONFIG
          );
          return response.data;
        },
      }),

    useUpdatePayoutConfig: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<PayoutConfig>, UpdatePayoutConfigRequest>({
        mutationFn: async (data) => {
          const response = await apiClient.patch<BaseApiResponse<PayoutConfig>>(
            ENDPOINTS.PAYOUTS.PAYOUT_CONFIG,
            data
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Payout config updated successfully");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.config(),
          });
        },
        onError: (error) => {
          console.error("Failed to update payout config:", error);
        },
      });
    },

    // ====== Settlements ======
    useGetSettlements: () =>
      useQuery<BaseApiResponse<Settlement[]>>({
        queryKey: PAYOUT_QUERY_KEYS.settlements(),
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<Settlement[]>>(
            ENDPOINTS.PAYOUTS.SETTLEMENTS
          );
          return response.data;
        },
      }),

    // ====== Simulation ======
    usePreparePayout: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<SimulationPrepareResponse>, void>({
        mutationFn: async () => {
          const response = await apiClient.post<BaseApiResponse<SimulationPrepareResponse>>(
            ENDPOINTS.PAYOUTS.SIMULATION.PREPARE
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Payout prepared successfully");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.estimated(),
          });
        },
        onError: (error) => {
          console.error("Failed to prepare payout:", error);
        },
      });
    },

    useProcessPayoutNow: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<SimulationProcessResponse>, void>({
        mutationFn: async () => {
          const response = await apiClient.post<BaseApiResponse<SimulationProcessResponse>>(
            ENDPOINTS.PAYOUTS.SIMULATION.PROCESS_NOW
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Payout processed");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.settlements(),
          });
        },
        onError: (error) => {
          console.error("Failed to process payout:", error);
        },
      });
    },

    useTriggerPayoutCron: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<Record<string, never>>, void>({
        mutationFn: async () => {
          const response = await apiClient.post<BaseApiResponse<Record<string, never>>>(
            ENDPOINTS.PAYOUTS.SIMULATION.TRIGGER_CRON
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Payout cron triggered successfully");
          queryClient.invalidateQueries({
            queryKey: PAYOUT_QUERY_KEYS.settlements(),
          });
        },
        onError: (error) => {
          console.error("Failed to trigger payout cron:", error);
        },
      });
    },
  };
};

export const PayoutApi = createPayoutApi();
