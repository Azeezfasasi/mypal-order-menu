import { cn } from "@/lib/utils";
import { CheckCircle, ImageIcon, Palette, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ImageGenerationShimmerProps {
  className?: string;
}

const generationStages = [
  {
    icon: Sparkles,
    message: "Analyzing your description...",
    duration: 10000,
  },
  {
    icon: Palette,
    message: "Choosing colors and style...",
    duration: 25000,
  },
  {
    icon: ImageIcon,
    message: "Generating your flyer...",
    duration: 25000,
  },
  {
    icon: CheckCircle,
    message: "Almost ready!",
    duration: 7000,
  },
];

export const ImageGenerationShimmer: React.FC<ImageGenerationShimmerProps> = ({
  className,
}) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let totalTime = 0;

    generationStages.forEach((stage, index) => {
      const timer = setTimeout(() => {
        setCurrentStage(index);
      }, totalTime);

      timers.push(timer);
      totalTime += stage.duration;
    });

    // Reset to first stage when component unmounts or starts over
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const CurrentIcon = generationStages[currentStage]?.icon || Sparkles;
  const currentMessage =
    generationStages[currentStage]?.message || "Generating flyer...";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50",
        "flex items-center justify-center",
        "w-full max-w-[400px] sm:max-w-[300px] aspect-video mx-0 sm:mx-auto",
        className
      )}
    >
      {/* Animated shimmer overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4 text-gray-700 px-4">
        {/* Animated icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
            <CurrentIcon className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          {/* Pulse ring animation */}
          <div className="absolute inset-0 w-16 h-16 border-2 border-blue-300 rounded-full animate-ping opacity-30" />
        </div>

        {/* Stage message */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-gray-700">{currentMessage}</p>

          {/* Progress dots */}
          <div className="flex justify-center space-x-1">
            {generationStages.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  index <= currentStage ? "bg-blue-500" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center max-w-xs">
          Creating your AI-powered event flyer...
        </p>
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-3 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60 animate-float"
            style={{
              left: `${20 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGenerationShimmer;
