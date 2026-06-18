import { BusinessCategoryType } from "./enums";

// src/services/api/business-types.ts (or wherever types are defined)
export interface BusinessCategory {
  value: BusinessCategoryType;
  label: string;
}

// Payload for updating bank details
export interface UpdateBusinessBankRequest {
  business_bank_name: string;
  bank_code: string;
  business_acc_name: string;
  business_acc_number: string;
}

// New upload/media type definitions to match API responses
export type UploadType =
  | "image"
  | "video"
  | "flyer"
  | "color_theme"
  | "slogan"
  | "tags"
  | "other";

// Generic upload item returned by /uploads/business endpoints
export interface IBusinessUploadItem {
  id: string;
  type: UploadType;
  // Either a hosted URL for file uploads or a text value for text-based uploads
  url?: string | null;
  value?: string | null;
  // Optional file metadata
  filename?: string | null;
  mimetype?: string | null;
  size?: number | null;
  // Optional relation to business
  business?: {
    id: string;
  } | null;
  createdAt: string; // ISO timestamp
  updatedAt?: string | null;
}

// Replace empty interfaces with type aliases for compatibility
export type IBusinessMedia = IBusinessUploadItem;
export type IBusinessMediaItem = IBusinessUploadItem;
