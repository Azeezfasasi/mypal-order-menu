// components/ui/badge.tsx
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline:
          "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",

        // Extended variants
        success:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        warning:
          "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        purple:
          "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        pink: "border-transparent bg-pink-100 text-pink-800 hover:bg-pink-200",

        // Solid variants
        "solid-success":
          "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
        "solid-warning":
          "border-transparent bg-amber-600 text-white hover:bg-amber-700",
        "solid-info":
          "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        "solid-purple":
          "border-transparent bg-purple-600 text-white hover:bg-purple-700",

        // Outline variants
        "outline-success":
          "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
        "outline-warning": "border-amber-300 text-amber-700 hover:bg-amber-50",
        "outline-info": "border-blue-300 text-blue-700 hover:bg-blue-50",

        // Soft variants
        "soft-default":
          "border-transparent bg-primary-50 text-primary-700 hover:bg-gray-100",
        "soft-success":
          "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        "soft-warning":
          "border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100",
        "soft-info":
          "border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100",
      },
      badgeType: {
        badge: "rounded-md border px-2.5 py-0.5 text-xs",
        pill: "rounded-full border px-3 py-1 text-xs",
        dot: "rounded-full px-2 py-1 text-xs",
        "dot-only": "rounded-full w-2 h-2 p-0 border-0",
      },
    },
    defaultVariants: {
      variant: "default",
      badgeType: "badge",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, badgeType, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, badgeType }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
