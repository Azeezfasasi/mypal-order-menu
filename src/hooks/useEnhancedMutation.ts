import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import { STATUSCODE } from "@/lib/constants";
import { BaseError } from "@/types/api";
import { toast } from "sonner";

export function useMutationWithRetry<TData, TVariables>(
  props: Omit<UseMutationOptions<TData, BaseError, TVariables>, "retry"> & {
    maxRetries?: number;
  }
) {
  const { mutationFn, maxRetries = 2, ...options } = props;
  const mutation = useMutation({
    mutationFn,
    ...options,
    retry: (failureCount, error) => {
      // Only retry on network errors, not validation errors
      if (error?.response?.data?.code === STATUSCODE.VALIDATION_ERROR) {
        return false;
      }
      return failureCount < maxRetries;
    },
  });

  return mutation;
}

export type UseSafeMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, BaseError, TVariables>,
  "retry" | "onError"
> & {
  /**
   * Optional custom error handler. If provided, it will override the default.
   */
  onError?: (
    error: BaseError,
    variables: TVariables,
    context?: unknown
  ) => void;
  /**
   * Maximum number of retries. Defaults to 2.
   */

  maxRetries?: number;
};

export function useSafeMutation<TData, TVariables>(
  options: UseSafeMutationOptions<TData, TVariables>
) {
  const { mutationFn, onError, maxRetries, ...restOptions } = options;

  const defaultOnError = (
    error: BaseError,
    variables: TVariables,
    context?: unknown
  ) => {
    const msg =
      error?.response?.data?.message ||
      "Something went wrong, please try again.";

    if (process.env.NODE_ENV === "development") {
      console.log("default error use safe mutation:", { context, variables });
    }

    toast.error("Error", {
      description: msg,
    });
  };

  return useMutationWithRetry({
    mutationFn,
    onError: onError ?? defaultOnError,
    maxRetries,
    ...restOptions,
  });
}
