import React from "react";
import { AlertTriangle } from "lucide-react"; // Choose one or make it configurable
import { Button } from "@/components/ui/button"; // If using shadcn Button
import { cn } from "@/lib/utils"; // If using shadcn utils for className merging

// Interface for common API error structures (adjust as needed)
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      // other potential fields like errorCode, details...
    };
    status?: number;
    statusText?: string;
  };
}

type ErrorDisplayProps = {
  error: unknown; // Accept various error types
  title?: string;
  message?: string;
  showDetails?: boolean; // Option to toggle technical details
  onRetry?: () => void; // Callback for retry action
  className?: string;
};

// Helper to extract message (can be more sophisticated)
function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    // Check for common API error structure within the Error object
    const apiError = error as Error & ApiErrorResponse;
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    return apiError.message; // Standard error message
  }
  // Check specifically for object structure matching common API errors if not an Error instance
  if (typeof error === "object" && error !== null) {
    const apiError = error as ApiErrorResponse;
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  // Fallback
  try {
    return JSON.stringify(error); // Last resort, show raw error if possible
  } catch {
    return "An unknown error occurred.";
  }
}

export function ErrorDisplay({
  error,
  title = "An Error Occurred", // Default title
  message,
  showDetails = false, // Default to hiding details
  onRetry,
  className,
}: ErrorDisplayProps) {
  const derivedMessage = message || getErrorMessage(error); // Use prop or derive
  const detailsString = showDetails
    ? typeof error === "object"
      ? JSON.stringify(error, null, 2)
      : String(error)
    : null;

  console.error("Error Display:", error); // Always log the full error for debugging

  return (
    <div
      className={cn(
        "border-l-4 border-destructive bg-red-50 p-4 rounded-md shadow-sm", // Use destructive theme color
        className
      )}
      role="alert"
    >
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-destructive mr-3 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-semibold text-destructive">{title}</h3>
          {derivedMessage && (
            <p className="text-sm text-red-800 mt-1">{derivedMessage}</p>
          )}
        </div>
      </div>

      {/* Optional Details Section */}
      {detailsString && (
        <details className="mt-3 text-xs text-red-700">
          <summary className="cursor-pointer font-medium hover:underline">
            Details
          </summary>
          <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded text-red-900 break-words">
            {detailsString}
          </pre>
        </details>
      )}

      {/* Optional Retry Button */}
      {onRetry && (
        <div className="mt-4">
          <Button variant="destructive" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
