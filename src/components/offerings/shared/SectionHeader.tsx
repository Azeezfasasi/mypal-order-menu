// components/ui/menu/SectionHeader.tsx
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface SectionHeaderProps {
  title: string;
  buttonLabel?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?:
    | "default"
    | "outline"
    | "link"
    | "destructive"
    | "secondary"
    | "ghost";
  buttonDisabled?: boolean;
}

export function SectionHeader({
  title,
  buttonLabel,
  icon: Icon,
  onClick,
  variant = "default",
  buttonDisabled = false,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center font-sora justify-between mb-6">
      <h2 className="text-2xl font-semibold text-primary-600 md:text-lg">
        {title}
      </h2>
      {buttonLabel && onClick && (
        <Button
          onClick={onClick}
          disabled={buttonDisabled}
          className={
            variant === "default"
              ? "bg-primary hover:bg-primary/90 flex items-center gap-1"
              : "bg-gray-100 border-gray-200 hover:bg-gray-200 font-normal font-inter"
          }
          variant={variant === "default" ? "default" : "outline"}
        >
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
