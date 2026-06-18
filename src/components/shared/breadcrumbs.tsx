// src/components/breadcrumbs.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export interface BreadcrumbItem {
  label: string;
  href?: string; // Make href optional for the last item
  onClick?: () => void; // Optional click handler
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showBackArrow?: boolean;
  backHref?: string;
  backOnClick?: () => void;
}

export function Breadcrumbs({
  items,
  showBackArrow = false,
  backHref,
  backOnClick,
}: BreadcrumbsProps) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 border-b px-6 py-4 text-sm">
      {showBackArrow && (backHref || backOnClick) && (
        <Button
          variant={"ghost"}
          onClick={backOnClick}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          disabled={!backOnClick && !backHref}
          aria-label="Go back"
          asChild={!!backHref} // Render as Link if href is provided
        >
          {backHref ? (
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </Button>
      )}
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground hover:underline"
            >
              {item.label}
            </Link>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-foreground hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span> // Last item
          )}
        </div>
      ))}
    </div>
  );
}
