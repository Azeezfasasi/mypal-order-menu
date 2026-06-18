// src/services/api/banks-api.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client"; // Assuming you have an apiClient set up
import type { BaseApiResponse } from "@/types/api";
import { ENDPOINTS } from "./endpoints"; // Assuming you have an endpoints file

// Define the structure of the bank data from the API
export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  supports_transfer: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

type BankApiResponse = BaseApiResponse<Bank[]>;

const createDefaultsApi = () => {
  return {
    useGetAllBanks: () =>
      useQuery<Bank[]>({
        queryKey: ["banks"],
        queryFn: async () => {
          const response = await apiClient.get<BankApiResponse>(
            ENDPOINTS.DEFAULTS.BANKS_GET_ALL,
            {}
          );
          return response.data.data;
        },
        staleTime: Infinity, // Adjust as needed
      }),
  };
};

export const DefaultsApi = createDefaultsApi();
