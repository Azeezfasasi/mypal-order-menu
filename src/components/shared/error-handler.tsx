import React, { useState } from "react";
import { XCircle } from "lucide-react"; // Using XCircle for an error icon
import { Button } from "@/components/ui/button"; // Assuming you have a Button component (e.g., from shadcn/ui)

interface ErrorHandlerProps {
  /**
   * The error message to display.
   */
  message: string;
  /**
   * An optional title for the error message.
   */
  title?: string;
  /**
   * Additional Tailwind CSS classes for the container div.
   */
  className?: string;
  /**
   * If true, a dismiss button will be shown.
   */
  dismissible?: boolean;
  /**
   * Callback function when the dismiss button is clicked.
   * Only relevant if `dismissible` is true.
   */
  onDismiss?: () => void;
  /**
   * Optional children to render inside the error container.
   * This allows for extending the component with custom content.
   */
  children?: React.ReactNode;
}

/**
 * A reusable component to display error messages.
 * It can be customized with title, dismiss button, and custom content.
 */
const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  message,
  title = "Error", // Default title
  className,
  dismissible = false,
  onDismiss,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null; // Don't render if dismissed
  }

  return (
    <div
      className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative ${className}`}
      role="alert" // Accessibility role
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          <XCircle className="h-5 w-5 text-red-500" /> {/* Error icon */}
        </div>
        <div className="flex-grow">
          {title && <strong className="font-bold block">{title}</strong>}
          <span className="block sm:inline">{message}</span>
          {children} {/* Render children for extendability */}
        </div>
        {dismissible && (
          <div className="flex-shrink-0 ml-4">
            <Button
              onClick={handleDismiss}
              className="p-1 -mt-1 -mr-1 bg-transparent hover:bg-red-200 text-red-500 hover:text-red-800 rounded focus:outline-none focus:shadow-outline"
              aria-label="Dismiss"
              size="sm" // Assuming your Button component has a size prop
            >
              <svg
                className="h-4 w-4"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L6.39 5.02a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorHandler;
