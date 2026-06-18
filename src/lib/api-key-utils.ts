"use client";

/**
 * API Key Management Utilities
 * Handles backend API key configuration and validation
 */

export const API_KEY_CONFIG = {
  headerName: "X-API-Key",
  envVarName: "NEXT_PUBLIC_API_KEY",
} as const;

/**
 * Get the API key from environment variables
 */
export const getApiKey = (): string | null => {
  return process.env.NEXT_PUBLIC_API_KEY || null;
};

/**
 * Check if API key is configured
 */
export const isApiKeyConfigured = (): boolean => {
  return !!getApiKey();
};

/**
 * Get API key status for debugging
 */
export const getApiKeyStatus = () => {
  const apiKey = getApiKey();
  return {
    isConfigured: !!apiKey,
    length: apiKey?.length || 0,
    masked: apiKey
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : null,
    headerName: API_KEY_CONFIG.headerName,
  };
};

/**
 * Validate API key format (basic validation)
 */
export const validateApiKey = (apiKey: string | null): boolean => {
  if (!apiKey) return false;

  // Basic validation - should be a non-empty string with reasonable length
  return apiKey.length > 10 && apiKey.length < 200;
};

/**
 * Create headers object with API key
 */
export const createApiHeaders = (
  additionalHeaders?: Record<string, string>,
) => {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (apiKey) {
    headers[API_KEY_CONFIG.headerName] = apiKey;
  }

  return headers;
};

// Debug logging in development
if (process.env.NODE_ENV === "development") {
  console.log("🔑 API Key Status:", getApiKeyStatus());
}
