import { useMemo } from "react";
import { SortingState } from "@tanstack/react-table";

/**
 * Custom hook to sort data based on a given sorting state.
 *
 * @param {T[]} rawData - The unsorted data array.
 * @param {SortingState} sorting - The current sorting state.
 * @returns {T[]} The sorted data.
 */
export function useSortedData<T>(rawData: T[], sorting: SortingState): T[] {
  return useMemo(() => {
    if (sorting.length === 0) return rawData;

    const { id, desc } = sorting[0];

    return [...rawData].sort((a, b) => {
      const valueA = a[id as keyof T];
      const valueB = b[id as keyof T];

      if (typeof valueA === "number" && typeof valueB === "number") {
        return desc ? valueB - valueA : valueA - valueB;
      }
      if (typeof valueA === "string" && typeof valueB === "string") {
        return desc
          ? valueB.localeCompare(valueA)
          : valueA.localeCompare(valueB);
      }
      return 0;
    });
  }, [rawData, sorting]);
}
