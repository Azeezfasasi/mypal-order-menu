// agreement-api.ts
// API service for business, accommodation agreements and terms

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type {
  IAccommodationAgreement,
  IAgreementTerm,
  IBusinessAgreement,
  ICreateAccommodationAgreementDto,
  ICreateAgreementTermDto,
  ICreateBusinessAgreementDto,
  IUpdateAccommodationAgreementDto,
  IUpdateAgreementTermDto,
  IUpdateBusinessAgreementDto,
} from "@/types/agreement-types";
import type { BaseApiResponse } from "@/types/api";
import {
  ICombinedAccommodationAgreement,
  ICombinedBusinessAgreement,
} from "@/types/combined-agreement-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export const createAgreementApi = () => {
  return {
    // ===== ACCOMMODATION AGREEMENT ENDPOINTS =====
    useGetAccommodationAgreements: () =>
      useQuery<BaseApiResponse<IAccommodationAgreement[]>>({
        queryKey: ["accommodation-agreements"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.GET_ALL
          );
          return response.data;
        },
      }),

    useGetAccommodationAgreementMy: () =>
      useQuery<BaseApiResponse<IAccommodationAgreement>>({
        queryKey: ["accommodation-agreement-my"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.GET_MY
          );
          return response.data;
        },
      }),

    useGetAccommodationAgreementByBusiness: (business_id: string) =>
      useQuery<BaseApiResponse<IAccommodationAgreement>>({
        queryKey: ["accommodation-agreement", business_id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.GET_BY_BUSINESS(business_id)
          );
          return response.data;
        },
        enabled: !!business_id,
      }),

    useGetAccommodationAgreementById: (id: string) =>
      useQuery<BaseApiResponse<IAccommodationAgreement>>({
        queryKey: ["accommodation-agreement", id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.GET_BY_ID(id)
          );
          return response.data;
        },
        enabled: !!id,
      }),

    useCreateAccommodationAgreement: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAccommodationAgreement>,
        ICreateAccommodationAgreementDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.CREATE,
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["accommodation-agreements"],
          });
        },
      });
    },

    useUpdateAccommodationAgreement: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAccommodationAgreement>,
        { id: string; data: IUpdateAccommodationAgreementDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.UPDATE(id),
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["accommodation-agreements"],
          });
        },
      });
    },

    useUpdateAccommodationAgreementAdmin: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAccommodationAgreement>,
        { id: string; data: Partial<IUpdateAccommodationAgreementDto> }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.UPDATE_ADMIN(id),
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["accommodation-agreements"],
          });
        },
      });
    },

    useDeleteAccommodationAgreement: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete(
            ENDPOINTS.AGREEMENTS.ACCOMMODATION.DELETE(id)
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["accommodation-agreements"],
          });
        },
      });
    },

    // ===== BUSINESS AGREEMENT ENDPOINTS =====
    useGetBusinessAgreements: () =>
      useQuery<BaseApiResponse<IBusinessAgreement[]>>({
        queryKey: ["business-agreements"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.BUSINESS.GET_ALL
          );
          return response.data;
        },
      }),

    useGetBusinessAgreementMy: () =>
      useQuery<BaseApiResponse<IBusinessAgreement>>({
        queryKey: ["business-agreement-my"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.BUSINESS.GET_MY
          );
          return response.data;
        },
      }),

    useGetBusinessAgreementByBusiness: (business_id: string) =>
      useQuery<BaseApiResponse<IBusinessAgreement>>({
        queryKey: ["business-agreement", business_id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.BUSINESS.GET_BY_BUSINESS(business_id)
          );
          return response.data;
        },
        enabled: !!business_id,
      }),

    useGetBusinessAgreementById: (id: string) =>
      useQuery<BaseApiResponse<IBusinessAgreement>>({
        queryKey: ["business-agreement", id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.BUSINESS.GET_BY_ID(id)
          );
          return response.data;
        },
        enabled: !!id,
      }),

    useCreateBusinessAgreement: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessAgreement>,
        ICreateBusinessAgreementDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post(
            ENDPOINTS.AGREEMENTS.BUSINESS.CREATE,
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-agreements"] });
        },
      });
    },

    useUpdateBusinessAgreement: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessAgreement>,
        { id: string; data: IUpdateBusinessAgreementDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch(
            ENDPOINTS.AGREEMENTS.BUSINESS.UPDATE(id),
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-agreements"] });
        },
      });
    },

    useUpdateBusinessAgreementAdmin: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessAgreement>,
        { id: string; data: Partial<IUpdateBusinessAgreementDto> }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch(
            ENDPOINTS.AGREEMENTS.BUSINESS.UPDATE_ADMIN(id),
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-agreements"] });
        },
      });
    },

    useDeleteBusinessAgreement: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete(
            ENDPOINTS.AGREEMENTS.BUSINESS.DELETE(id)
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-agreements"] });
        },
      });
    },

    // ===== AGREEMENT TERMS ENDPOINTS =====
    useGetAgreementTerms: () =>
      useQuery<BaseApiResponse<IAgreementTerm[]>>({
        queryKey: ["agreement-terms"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.TERMS.GET_ALL
          );
          return response.data;
        },
      }),

    useGetAgreementTermById: (id: string) =>
      useQuery<BaseApiResponse<IAgreementTerm>>({
        queryKey: ["agreement-term", id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.TERMS.GET_BY_ID(id)
          );
          return response.data;
        },
        enabled: !!id,
      }),

    useCreateAgreementTerm: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAgreementTerm>,
        ICreateAgreementTermDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post(
            ENDPOINTS.AGREEMENTS.TERMS.CREATE,
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["agreement-terms"] });
        },
      });
    },

    useUpdateAgreementTerm: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAgreementTerm>,
        { id: string; data: IUpdateAgreementTermDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch(
            ENDPOINTS.AGREEMENTS.TERMS.UPDATE(id),
            data
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["agreement-terms"] });
        },
      });
    },

    useDeleteAgreementTerm: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete(
            ENDPOINTS.AGREEMENTS.TERMS.DELETE(id)
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["agreement-terms"] });
        },
      });
    },
    // ===== COMBINED AGREEMENT ENDPOINTS =====
    useGetCombinedBusinessAgreement: (business_id: string) =>
      useQuery<ICombinedBusinessAgreement>({
        queryKey: ["combined-business-agreement", business_id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.COMBINED.GET_BUSINESS(business_id)
          );
          return response.data;
        },
        enabled: !!business_id,
      }),

    useGetCombinedAccommodationAgreement: (business_id: string) =>
      useQuery<ICombinedAccommodationAgreement>({
        queryKey: ["combined-accommodation-agreement", business_id],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.AGREEMENTS.COMBINED.GET_ACCOMMODATION(business_id)
          );
          return response.data;
        },
        enabled: !!business_id,
      }),
  };
};

export type AgreementApi = ReturnType<typeof createAgreementApi>;
