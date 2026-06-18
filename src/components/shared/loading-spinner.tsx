import React from "react";
import { Loader2 } from "lucide-react"; // Assuming lucide-react is installed

interface LoaderProps {
  /**
   * Size of the loader icon and text.
   * Can be a Tailwind size class (e.g., 'h-6 w-6') or a number (e.g., 24).
   * If a number, it will be applied as pixel size.
   */
  size?: string | number;
  /**
   * Color of the loader icon and text.
   * Can be a Tailwind text color class (e.g., 'text-blue-500') or a CSS color string.
   */
  color?: string;
  /**
   * Custom message to display below the loader icon.
   */
  message?: string;
  /**
   * Additional Tailwind CSS classes for the container div.
   */
  className?: string;
}

/**
 * A reusable loader component with a spinning icon and optional message.
 */
const Loader: React.FC<LoaderProps> = ({
  size = "h-8 w-8", // Default size
  color = "text-orange-600", // Default color matching your example
  message,
  className,
}) => {
  // Determine icon size class based on the size prop
  const iconSizeClass =
    typeof size === "number" ? `h-[${size}px] w-[${size}px]` : size;

  // Determine text size class based on the icon size (adjust as needed)
  const textSizeClass = typeof size === "number" ? `text-base` : "text-base"; // Simple default for now

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`} // Center content and apply custom classes
    >
      <Loader2
        className={`animate-spin ${iconSizeClass} ${color}`} // Apply animation, size, and color
        // If color is a CSS string, apply it via style
        style={color && !color.startsWith("text-") ? { color: color } : {}}
      />
      {message && <p className={`mt-2 ${textSizeClass} ${color}`}>{message}</p>}
    </div>
  );
};

export default Loader;
