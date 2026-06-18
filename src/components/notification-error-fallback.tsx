"use client";

import React from "react";

interface NotificationErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function NotificationErrorFallback({
  error,
  resetError,
}: NotificationErrorFallbackProps) {
  // Log the error but don't show anything to the user for notification-specific errors
  React.useEffect(() => {
    console.warn(
      "Notification component error (gracefully handled):",
      error.message,
    );
  }, [error]);

  // For notification errors, we'll render nothing instead of showing an error UI
  // This allows the rest of the app to work normally even if notifications fail
  if (
    error.message.includes("Notification") ||
    error.message.includes("push")
  ) {
    return null;
  }

  // For other errors, show a minimal error message
  return (
    <div className="text-xs text-gray-500 p-2 text-center">
      Some features may be temporarily unavailable.{" "}
      <button
        onClick={resetError}
        className="text-blue-600 hover:text-blue-700 underline"
      >
        Retry
      </button>
    </div>
  );
}

export default NotificationErrorFallback;
