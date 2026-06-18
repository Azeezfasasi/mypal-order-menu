// Utility functions for PWA functionality
import { isSupported as isMessagingSupported } from "firebase/messaging";

export function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // @ts-expect-error - for iOS Safari
    window.navigator.standalone === true
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(display-mode: standalone)").matches;
}

export async function canInstallAsync(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const sdkSupported = await isMessagingSupported();
    if (sdkSupported) return true;
  } catch {
    // ignore and fallback to feature detection
  }

  return "serviceWorker" in navigator && "BeforeInstallPromptEvent" in window;
}

export function canInstall(): boolean {
  if (typeof window === "undefined") return false;

  return "serviceWorker" in navigator && "BeforeInstallPromptEvent" in window;
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;

  return navigator.onLine;
}

// Hook to detect PWA installation status
export function usePWAInstallation() {
  if (typeof window === "undefined") {
    return { isPWA: false, isStandalone: false, canInstall: false };
  }

  return {
    isPWA: isPWA(),
    isStandalone: isStandalone(),
    canInstall: canInstall(),
  };
}
