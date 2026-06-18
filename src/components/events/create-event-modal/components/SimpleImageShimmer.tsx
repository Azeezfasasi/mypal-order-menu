import { cn } from "@/lib/utils";
import { ImageIcon, Loader2 } from "lucide-react";
import React from "react";

interface SimpleImageShimmerProps {
  className?: string;
  message?: string;
}

export const SimpleImageShimmer: React.FC<SimpleImageShimmerProps> = ({
  className,
  message = "Generating your flyer...",
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50",
        "flex flex-col items-center justify-center",
        "w-full max-w-[400px] sm:max-w-[300px] aspect-video mx-0 sm:mx-auto space-y-3",
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-3">
        {/* Spinning loader with image icon */}
        <div className="relative">
          <ImageIcon className="w-12 h-12 text-blue-400" />
          <Loader2 className="absolute inset-0 w-12 h-12 text-blue-600 animate-spin" />
        </div>

        {/* Message */}
        <p className="text-sm font-medium text-blue-700 text-center">
          {message}
        </p>

        {/* Animated dots */}
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleImageShimmer;
