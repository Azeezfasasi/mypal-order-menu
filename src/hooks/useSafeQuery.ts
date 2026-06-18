import {
  useQuery,
  UseQueryOptions,
  QueryKey,
  QueryFunction,
  UseQueryResult,
} from "@tanstack/react-query";

/**
 * useSafeQuery is a wrapper around useQuery that disables the query if the key or queryFn is missing or falsy.
 * It also allows you to pass an `enabled` flag for more granular control.
 *
 * @param key - The query key (array or string)
 * @param queryFn - The query function
 * @param options - Additional options (enabled, etc)
 */
export function useSafeQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  key: TQueryKey | undefined,
  queryFn: QueryFunction<TQueryFnData, TQueryKey> | undefined,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
  > & { enabled?: boolean }
): UseQueryResult<TData, TError> {
  const enabled = Boolean(key && queryFn && (options?.enabled ?? true));
  return useQuery({
    queryKey: key as TQueryKey,
    queryFn: queryFn as QueryFunction<TQueryFnData, TQueryKey>,
    ...options,
    enabled,
  });
}
