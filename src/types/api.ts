export type BaseError = {
  code: string;
  status?: number;
  message: string;
  errors?: Record<string, string[]>;
  response: {
    status?: number;
    data: {
      message: string;
      code: number;
    };
  };
};

// Type guard for error object
export type AIError = {
  statusCode?: number;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};
export interface BaseApiResponse<T> {
  data: T;
  status: string;
  statusCode: number; //status code
  message: string;
}

export interface PaginationResult<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Error Response Interface
export interface IBusinessErrorResponse {
  status: "error";
  statusCode: number;
  message: string;
  data: null;
}

// Success Response Interface
export interface IBusinessSuccessResponse<T> {
  status: "success";
  statusCode: number;
  message: string;
  data: T;
}
