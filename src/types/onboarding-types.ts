import type { IBusiness } from "./auth-types";
import { OnboardingSource, OnboardingStatus } from "./enums";

/**
 * Onboarding token validation response
 */
export interface IOnboardingTokenData {
  business_name: string;
  email: string;
  category: {
    id: string;
    name: string;
  };
  city: string;
  state: string;
  country: string;
  onboarding_status: OnboardingStatus;
  expires_at: string;
  source: OnboardingSource;
}

/**
 * Onboarding token validation response
 */
export interface IValidateOnboardingTokenResponse {
  data: IOnboardingTokenData;
  message: string;
}

/**
 * Set password for onboarding request
 */
export interface ISetOnboardingPasswordData {
  password: string;
  confirmPassword?: string;
}

/**
 * Set password for onboarding response
 */
export interface ISetOnboardingPasswordResponse {
  access_token: string;
  business: IBusiness;
  message: string;
}

/**
 * Onboarding flow state
 */
export type OnboardingStep = "validate" | "password" | "documents" | "success";

/**
 * Onboarding context data
 */
export interface IOnboardingContext {
  token: string;
  businessData: IOnboardingTokenData | null;
  currentStep: OnboardingStep;
  isLoading: boolean;
  error: string | null;
}
