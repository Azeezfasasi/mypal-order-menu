import { IBusinessCategory } from "@/services/api/business-categories-api";
import {
  OnboardingSource,
  OnboardingStatus,
  VerificationStatus,
} from "./enums";

// Admin Interface (minimal, for agreement references)
export interface IAdmin {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
// Business Authentication Types

// Common Business Interface

export interface VerificationRequirements {
  notes: string;
  requiredFields: string[];
}
export interface IBusiness {
  email: string;
  password: string;
  business_name: string | null;
  business_number: string | null;
  phone_number: string | null;
  description: string | null;
  image_url: string | null;
  available_categories: null;
  city: string;
  state: string;
  country: string;
  business_bank_code?: string;
  business_bank_name: string | null;
  business_acc_name: string | null;
  business_acc_number: string | null;
  address: string | null;
  long: string | null;
  lat: string | null;
  business_type: string | null;
  business_start_date: string | null;
  tax_identification_number: string | null;
  cac_document: string | null;
  memat: string | null;
  director_identity: string | null;
  directors_address: string | null;
  shareholders_address: string | null;
  current_token: string;
  category?: IBusinessCategory;
  id: string;
  role: string;
  wallet: number;
  is_active: boolean;
  is_verified: VerificationStatus;
  verification_notes: string | null;
  verification_requirements: VerificationRequirements | null;
  access_token: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | null;
  verification_status?: VerificationStatus;
  onboarding_token_hash: string | null;
  onboarding_token_expires_at: string | null;
  onboarding_token_used_at: string;
  onboarding_completed_at: string | null;
  onboarding_status: OnboardingStatus;
  onboarding_source: OnboardingSource;
  needs_onboarding: boolean;
  requires_verification_update: boolean;
  primary_business: null;
  primary_business_id: null;
}

// Authentication Data Interfaces

export interface IBusinessSigninData {
  email: string;
  password: string;
}

export interface IBusinessSignupData {
  email: string;
  password: string;
}

export interface IBusinessForgotPasswordData {
  email: string;
}

export interface IBusinessVerifyOtpData {
  user_id: string;
  code: string;
}

export interface IBusinessResetPasswordData {
  email: string;
  code: string;
  new_password: string;
  confirmPassword?: string;
}

export interface IBusinessChangePasswordData {
  old_password: string;
  new_password: string;
}

// Response Interfaces
export interface IBusinessLoginResponse {
  access_token: string;
  business: IBusiness;
  primaryBusinessId: string | null;
  is_verified: VerificationStatus;
  verification_notes: string | null;
  verification_requirements: {
    notes: string;
    requiredFields: string[];
  } | null;
  linkedBusinesses: {
    id: string;
    business_name: string;
    category: {
      id: string;
      name: string;
    };
    is_primary: boolean;
  }[];
  member?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    password_hash: string;
    business_id: string;
    role_id: string;
    role: {
      id: string;
      name: string;
      business_id: string | null;
      is_default: boolean;
      createdAt: string; // ISO date string
      updatedAt: string; // ISO date string
    };
  };
}

export type IBusinessSignupResponse = IBusiness;

export interface IBusinessForgotPasswordResponse {
  // Add any specific fields returned during forgot password process
  user_id?: string;
}

export interface IBusinessVerifyOtpResponse {
  access_token: string;
  business: IBusiness;
}

export interface IBusinessResetPasswordResponse {
  access_token?: string;
  business?: IBusiness;
}

export interface IBusinessChangePasswordResponse {
  // Add any specific fields returned after password change
  business: IBusiness;
}

// Business Update Interface
export interface IBusinessUpdateData {
  business_name?: string;
  business_number?: string;
  description?: string;
  image?: File;
  address?: string;
  long?: number;
  lat?: number;
  business_bank_name?: string;
  business_acc_name?: string;
  business_acc_number?: string;
  category?: string;
  business_type?: string;
  business_start_date?: string;
  tax_identification_number?: string;
  cac_document?: File;
  memat?: File;
  director_identity?: File;
  directors_address?: string;
  shareholders_address?: string;
}

export type IBusinessUpdateResponse = IBusinessLoginResponse;

export interface IOnboardingDelegationDTO {
  delegations: {
    task_type: string;
    email: string;
  }[]
}
