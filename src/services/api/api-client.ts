// import { env } from "@src/config/env";

import { IBusinessErrorResponse, IBusinessSuccessResponse } from "@/types/api";
import axios, {
  AxiosResponse,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./endpoints";
import { requestInterceptor, responseErrorInterceptor } from "./interceptors";
// import { IBusiness } from "@/types/auth-types";

// Custom response type that combines our business response types
export type BusinessApiResponse<T = unknown> =
  | IBusinessSuccessResponse<T>
  | IBusinessErrorResponse;

// Add request logging
export const logAxiosRequest = (config: AxiosRequestConfig) => {
  const isFormData = config.data instanceof FormData;
  const contentType = config.headers?.["Content-Type"] || config.headers?.["content-type"];
  
  // console.log("🚀 API Request:", {
  //   url: `${config.baseURL}${config.url}`,
  //   method: config.method?.toUpperCase(),
  //   isFormData,
  //   contentType: contentType || "NOT_SET",
  //   headers: {
  //     ...config.headers,
  //     // Mask API key in logs for security
  //     "X-API-Key": config.headers?.["X-API-Key"]
  //       ? "***API_KEY_SET***"
  //       : "NOT_SET",
  //     Authorization: config.headers?.Authorization
  //       ? "***BEARER_TOKEN_SET***"
  //       : "NOT_SET",
  //   },
  //   dataType: isFormData ? "FormData" : typeof config.data,
  //   dataSize: isFormData ? "FormData(entries: " + Array.from((config.data as FormData).keys()).length + ")" : "JSON",
  // });
  
  if (isFormData) {
    console.log("📦 FormData entries being sent:");
    for (const [key, value] of (config.data as FormData).entries()) {
      if (value instanceof File) {
        console.log(`  - ${key}: [File: ${value.name}, ${value.size} bytes]`);
      } else {
        console.log(`  - ${key}: ${String(value).substring(0, 50)}`);
      }
    }
  }
};

// Add response logging
export const logAxiosResponse = (error: AxiosError) => {
  console.log("❌ Response Error:", {
    url: `${error.config?.baseURL}${error.config?.url}`,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: JSON.stringify(error.response?.data, null, 2),
    message: error.message,
  });
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  timeoutErrorMessage: "Request timed out", // Explicit timeout message
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
  },
});

// Validate API configuration
export const validateApiConfiguration = () => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl = API_BASE_URL;

  const isValid = !!(apiKey && baseUrl);

  // console.log("🔧 API Configuration Status:", {
  //   apiKey: apiKey ? "***CONFIGURED***" : "❌ MISSING",
  //   baseUrl: baseUrl ? "***CONFIGURED***" : "❌ MISSING",
  //   isValid: isValid ? "✅ READY" : "❌ INVALID",
  // });

  return {
    isValid,
    hasApiKey: !!apiKey,
    hasBaseUrl: !!baseUrl,
  };
};

// Initialize API validation on module load
if (typeof window !== "undefined") {
  validateApiConfiguration();
}

// Custom type guard to check if response is a success
export function isSuccessResponse<T>(
  response: IBusinessSuccessResponse<T> | IBusinessErrorResponse,
): response is IBusinessSuccessResponse<T> {
  return response.status === "success";
}

// Custom type guard to check if response is an error
export function isErrorResponse(
  response: IBusinessSuccessResponse<unknown> | IBusinessErrorResponse,
): response is IBusinessErrorResponse {
  return response.status === "error";
}

// Enhanced API method with specific type safety
export async function safeApiCall<T>(
  apiMethod: () => Promise<
    AxiosResponse<IBusinessSuccessResponse<T> | IBusinessErrorResponse>
  >,
): Promise<T> {
  try {
    const response = await apiMethod();

    if (isErrorResponse(response.data)) {
      throw new Error(response.data.message || "An unknown error occurred");
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle Axios specific errors
      const axiosError = error as AxiosError<IBusinessErrorResponse>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "An unexpected error occurred",
      );
    }

    // Rethrow if it's not an Axios error
    throw error;
  }
}

// Request interceptor for API calls
apiClient.interceptors.request.use(
  async (config) => {
    const configWithAuth = await requestInterceptor(config);
    logAxiosRequest(configWithAuth); // Log AFTER token is added
    return configWithAuth;
  },
  (error) => {
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    // console.group("API Response Debug");
    // console.log("Status:", response.status);
    // console.log("Data:", response.data);
    // console.groupEnd();
    return response;
  },
  async (error: AxiosError<{ code: number }>) => {
    // console.group("API Error Debug");
    // console.error("Full Error Object:", error);
    // console.error("Error Name:", error.name);
    // console.error("Error Message:", error.message);
    // console.error("Response Status:", error?.response?.status);
    // console.error("Response Data:", error?.response?.data);
    // console.groupEnd();
    logAxiosResponse(error);

    return responseErrorInterceptor(error);
  },
);

// src/services/api/api-client.ts
// import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// class ApiClient {
//   private client: AxiosInstance;

//   constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || "") {
//     this.client = axios.create({
//       baseURL,
//       timeout: 10000,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     this.setupInterceptors();
//   }

//   private setupInterceptors() {
//     // Request interceptor for auth token
//     this.client.interceptors.request.use(
//       (config) => {
//         const token = localStorage.getItem("auth_token");
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => Promise.reject(error)
//     );

//     // Response interceptor for error handling
//     this.client.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         if (error.response?.status === 401) {
//           // Handle unauthorized access
//           localStorage.removeItem("auth_token");
//           window.location.href = "/login";
//         }
//         return Promise.reject(error);
//       }
//     );
//   }

//   async get<T>(
//     url: string,
//     config?: AxiosRequestConfig
//   ): Promise<AxiosResponse<T>> {
//     return this.client.get<T>(url, config);
//   }

//   async post<T>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig
//   ): Promise<AxiosResponse<T>> {
//     return this.client.post<T>(url, data, config);
//   }

//   async put<T>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig
//   ): Promise<AxiosResponse<T>> {
//     return this.client.put<T>(url, data, config);
//   }

//   async patch<T>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig
//   ): Promise<AxiosResponse<T>> {
//     return this.client.patch<T>(url, data, config);
//   }

//   async delete<T>(
//     url: string,
//     config?: AxiosRequestConfig
//   ): Promise<AxiosResponse<T>> {
//     return this.client.delete<T>(url, config);
//   }

//   // Method for file uploads
//   async uploadFiles<T>(
//     url: string,
//     formData: FormData,
//     config?: AxiosRequestConfig
//   ): Promise<AxiosResponse<T>> {
//     return this.client.post<T>(url, formData, {
//       ...config,
//       headers: {
//         ...config?.headers,
//         "Content-Type": "multipart/form-data",
//       },
//     });
//   }
// }

// export const apiClient = new ApiClient();
