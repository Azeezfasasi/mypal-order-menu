import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "./endpoints";
import { apiClient } from "./api-client";
import { toast } from "sonner";

export interface IBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  manager_id?: string;
  manager_name?: string;
  is_active: boolean;
  opening_hours?: {
    [key: string]: {
      opens: string;
      closes: string;
      is_open: boolean;
    };
  };
  menu_items_count: number;
  menu_items_synced: number;
  createdAt?: string;
  updatedAt?: string;
  whatsapp_number?: string;
  country?: string;
  long?: number;
  lat?: number;
  is_main?: boolean;
}

export interface ICreateBranchPayload {
  name: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  whatsapp_number?: string;
  manager_id?: string;
  opening_hours?: {
    [day: string]: {
      opens: string;
      closes: string;
      is_open: boolean;
    };
  };
  clone_from_branch?: string;
  is_active?: boolean;
  long?: number;
  lat?: number;
  is_main?: boolean;
}

export interface IBranchStats {
  total_branches: number;
  active_locations: number;
  pending_review_count: number;
  total_menu_items_synced: number;
}

export interface IBranchMenuItem {
  item_id: string;
  price?: number;
  stock_quantity?: number;
  is_available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ILinkMenuItemsPayload {
  items: Array<{
    item_id: string;
    price?: number;
    stock_quantity?: number;
    is_available: boolean;
  }>;
}

// Custom hooks
export function useGetAllBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.BRANCHES.GET_ALL);
      return response.data;
    },
  });
}

export function useGetBranch(branchId: string) {
  return useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      const response = await apiClient.get(
        ENDPOINTS.BRANCHES.GET_ONE(branchId)
      );
      return response.data;
    },
    enabled: !!branchId,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ICreateBranchPayload) => {
      const response = await apiClient.post(
        ENDPOINTS.BRANCHES.CREATE,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch created successfully");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create branch")
          : "Failed to create branch";
      toast.error(errorMsg);
    },
  });
}

export function useUpdateBranch(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<IBranch>) => {
      const response = await apiClient.patch(
        ENDPOINTS.BRANCHES.UPDATE(branchId),
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branch", branchId] });
      toast.success("Branch updated successfully");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update branch")
          : "Failed to update branch";
      toast.error(errorMsg);
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (branchId: string) => {
      const response = await apiClient.delete(
        ENDPOINTS.BRANCHES.DELETE(branchId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch deleted successfully");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete branch")
          : "Failed to delete branch";
      toast.error(errorMsg);
    },
  });
}

export function useToggleBranchActive(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(
        ENDPOINTS.BRANCHES.TOGGLE_ACTIVE(branchId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branch", branchId] });
      toast.success("Branch status updated");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update branch status")
          : "Failed to update branch status";
      toast.error(errorMsg);
    },
  });
}

export function useGetBranchMenuItems(branchId: string) {
  return useQuery({
    queryKey: ["branch-menu-items", branchId],
    queryFn: async () => {
      console.log("Fetching menu items for branch:", branchId);
      const response = await apiClient.get(
        ENDPOINTS.BRANCHES.GET_MENU_ITEMS(branchId)
      );
      console.log("Full axios response:", response);
      console.log("response.data:", response.data);
      console.log("response.data.data:", response.data?.data);
      
      // API returns { status, statusCode, message, data: [...] }
      // Extract and return just the data array
      const menuItemsArray = response.data?.data || [];
      console.log("Returning menu items array from queryFn:", menuItemsArray);
      return menuItemsArray;
    },
    enabled: !!branchId,
  });
}

export function useLinkMenuItems(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ILinkMenuItemsPayload) => {
      const response = await apiClient.post(
        ENDPOINTS.BRANCHES.LINK_MENU_ITEMS(branchId),
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-menu-items", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Menu items linked successfully");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to link menu items")
          : "Failed to link menu items";
      toast.error(errorMsg);
    },
  });
}

export function useUpdateBranchMenuItem(branchId: string, itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<IBranchMenuItem>) => {
      const response = await apiClient.patch(
        ENDPOINTS.BRANCHES.UPDATE_MENU_ITEMS(branchId, itemId),
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-menu-items", branchId] });
      toast.success("Menu item updated successfully");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update menu item")
          : "Failed to update menu item";
      toast.error(errorMsg);
    },
  });
}

export function useUnlinkMenuItem(branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiClient.delete(
        ENDPOINTS.BRANCHES.UNLINK_MENU_ITEMS(branchId, itemId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-menu-items", branchId] });
      toast.success("Menu item removed successfully");
    },
    onError: (error: unknown) => {
      const errorMsg = 
        error && typeof error === "object" && "response" in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to remove menu item")
          : "Failed to remove menu item";
      toast.error(errorMsg);
    },
  });
}

// Backward compatibility - static methods that call the hooks
export class BranchesApi {
  static useGetAllBranches = useGetAllBranches;
  static useGetBranch = useGetBranch;
  static useCreateBranch = useCreateBranch;
  static useUpdateBranch = useUpdateBranch;
  static useDeleteBranch = useDeleteBranch;
  static useToggleBranchActive = useToggleBranchActive;
  static useGetBranchMenuItems = useGetBranchMenuItems;
  static useLinkMenuItems = useLinkMenuItems;
  static useUpdateBranchMenuItem = useUpdateBranchMenuItem;
  static useUnlinkMenuItem = useUnlinkMenuItem;
}
