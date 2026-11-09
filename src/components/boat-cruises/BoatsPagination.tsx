"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact pager shared by the boat screens (kept local so it ports to other apps as is) */
export function BoatsPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {sorted.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && p - sorted[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
          <button
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "min-w-8 rounded-md border px-2.5 py-1 text-sm",
              p === page ? "border-orange-500 bg-orange-50 font-semibold text-orange-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
