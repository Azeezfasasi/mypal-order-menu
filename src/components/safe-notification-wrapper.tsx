"use client";

import { getPushSupportStatus } from "@/config/firebase";
import React, { useEffect, useState } from "react";

interface SafeNotificationWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SafeNotificationWrapper({
  children,
  fallback = null,
}: SafeNotificationWrapperProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        setIsSupported(false);
        return;
      }

      // Check basic browser support for notifications
      const support = getPushSupportStatus();
      setIsSupported(support.supported);
    } catch (error) {
      console.warn("Error checking notification support:", error);
      setIsSupported(false);
      setHasError(true);
    }
  }, []);

  // Show nothing while checking support
  if (isSupported === null) {
    return null;
  }

  // Show nothing if not supported or has error
  if (!isSupported || hasError) {
    return fallback;
  }

  // Wrap children in error boundary
  try {
    return <>{children}</>;
  } catch (error) {
    console.warn("Notification component render error:", error);
    return fallback;
  }
}

export default SafeNotificationWrapper;
