import { useState } from "react";

export function usePagination<T>(
  items: T[],
  totalItems?: number,
  itemsPerPage = 6
) {
  const [currentPage, setCurrentPage] = useState(1);

  const total = totalItems ?? items.length;
  const totalPages = Math.ceil(total / itemsPerPage);

  const paginatedItems = items;

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    setCurrentPage,
  };
}
