"use client";

import { useEffect } from "react";

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      // If it's a notification-related error, prevent it from showing the generic error page
      if (
        event.reason &&
        typeof event.reason === "object" &&
        "message" in event.reason &&
        typeof event.reason.message === "string" &&
        (event.reason.message.includes("Notification") ||
          event.reason.message.includes("push"))
      ) {
        console.warn(
          "Notification error handled gracefully:",
          event.reason.message,
        );
        event.preventDefault(); // Prevent the error from showing
      }
    };

    // Handle general JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);

      // If it's a notification-related error, handle it gracefully
      if (
        event.error &&
        event.error.message &&
        (event.error.message.includes("Notification") ||
          event.error.message.includes("push"))
      ) {
        console.warn(
          "Notification error handled gracefully:",
          event.error.message,
        );
        event.preventDefault(); // Prevent the error from showing
      }
    };

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Cleanup
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}

export default GlobalErrorHandler;
