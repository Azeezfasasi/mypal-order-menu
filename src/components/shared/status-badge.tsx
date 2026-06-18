// components/shared/status-badge.tsx
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import React from "react";
import { Badge, badgeVariants } from "../ui/badge";

// Type for the extended badge variants
export type ExtendedBadgeVariant = VariantProps<
  typeof badgeVariants
>["variant"];
export type BadgeType = VariantProps<typeof badgeVariants>["badgeType"];

// Extended Badge Props
export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
  dotPosition?: "left" | "right";
  icon?: React.ComponentType<{ className?: string }>;
  badgeType?: BadgeType;
}

// Status Badge component
function StatusBadge({
  className,
  variant,
  badgeType = "badge",
  showDot = false,
  dotPosition = "left",
  icon: Icon,
  children,
  ...props
}: StatusBadgeProps) {
  // Dot color mapping for each variant
  const dotColors: Record<string, string> = {
    default: "bg-primary",
    secondary: "bg-secondary-foreground",
    destructive: "bg-destructive",
    outline: "bg-foreground",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    "solid-success": "bg-white",
    "solid-warning": "bg-white",
    "solid-info": "bg-white",
    "solid-purple": "bg-white",
    "outline-success": "bg-emerald-500",
    "outline-warning": "bg-amber-500",
    "outline-info": "bg-blue-500",
    "soft-success": "bg-emerald-400",
    "soft-warning": "bg-amber-400",
    "soft-info": "bg-blue-400",
    "soft-default": "bg-primary-400",
  };

  // Handle dot-only badge type
  if (badgeType === "dot-only") {
    return (
      <div
        className={cn(
          badgeVariants({ variant, badgeType }),
          dotColors[variant || "default"],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <Badge
      className={cn(badgeVariants({ variant, badgeType }), className)}
      variant={variant}
      badgeType={badgeType}
      {...props}
    >
      {showDot && dotPosition === "left" && (
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            badgeType === "pill" ? "mr-2" : "mr-1.5",
            dotColors[variant || "default"]
          )}
        />
      )}
      {Icon && (
        <Icon
          className={cn(
            "w-3 h-3",
            children ? (badgeType === "pill" ? "mr-2" : "mr-1.5") : ""
          )}
        />
      )}
      {children}
      {showDot && dotPosition === "right" && (
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            badgeType === "pill" ? "ml-2" : "ml-1.5",
            dotColors[variant || "default"]
          )}
        />
      )}
    </Badge>
  );
}

export { StatusBadge };

// // Usage examples
// export const statusConfigExamples = {
//   // Badge with dot
//   badgeWithDot: {
//     badgeType: "badge" as BadgeType,
//     showDot: true,
//     dotPosition: "left" as const,
//     colorMap: {
//       "Active": "success",
//       "Pending": "warning",
//       "Failed": "destructive",
//     },
//   },

//   // Pill style
//   pillStyle: {
//     badgeType: "pill" as BadgeType,
//     colorMap: {
//       "High Priority": "solid-warning",
//       "Medium Priority": "warning",
//       "Low Priority": "soft-info",
//     },
//   },

//   // Dot only (for compact displays)
//   dotOnly: {
//     badgeType: "dot-only" as BadgeType,
//     colorMap: {
//       "Online": "success",
//       "Offline": "destructive",
//       "Away": "warning",
//     },
//   },

//   // Regular badge
//   regularBadge: {
//     badgeType: "badge" as BadgeType,
//     colorMap: {
//       "Completed": "success",
//       "In Progress": "info",
//       "Cancelled": "outline",
//     },
//   },
// };
