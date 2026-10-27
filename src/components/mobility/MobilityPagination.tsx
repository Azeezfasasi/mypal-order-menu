"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface MobilityPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// First 3, current ±1 and last 3 pages, with "…" filling the gaps
function getPageItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  const pages = new Set<number>();
  for (let i = 1; i <= Math.min(3, totalPages); i++) pages.add(i);
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) pages.add(i);
  for (let i = Math.max(1, totalPages - 2); i <= totalPages; i++) pages.add(i);

  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) items.push("ellipsis");
    items.push(value);
  });
  return items;
}

export function MobilityPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: MobilityPaginationProps) {
  const safeTotal = Math.max(1, totalPages);

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 sm:flex-col sm:items-stretch",
        className,
      )}
    >
      <p className="text-sm text-gray-600">
        Page {page} of {safeTotal}
      </p>

      <div className="flex items-center gap-1 sm:hidden">
        {getPageItems(page, safeTotal).map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "h-8 min-w-8 rounded-md px-2 text-sm transition-colors",
                item === page
                  ? "bg-orange-50 font-medium text-orange-600"
                  : "text-gray-500 hover:bg-gray-100",
              )}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotal}
          className="gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
