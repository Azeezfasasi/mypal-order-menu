"use client";

import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Safe localStorage wrapper
  const getFromStorage = (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage not available:", error);
      return null;
    }
  };

  const setToStorage = (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
  };

  // Check if the prompt was recently dismissed
  const wasRecentlyDismissed = () => {
    const dismissedTime = getFromStorage("installPromptDismissedAt");
    if (!dismissedTime) return false;

    // Show the prompt again after 30 days
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    return Date.now() - Number(dismissedTime) < thirtyDaysInMs;
  };

  useEffect(() => {
    // Check if iOS device
    const iosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(iosDevice);

    // Check if already installed/standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Don't show any prompts if already standalone
    if (standalone) {
      return;
    }

    // Don't show the prompt if it was recently dismissed
    if (wasRecentlyDismissed()) {
      return;
    }

    // For iOS devices, show the iOS prompt immediately
    if (iosDevice) {
      setShowInstallPrompt(true);
      return;
    }

    // For other devices, wait for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response to the install prompt: ${outcome}`);

      // Clear the deferredPrompt so it can only be used once
      setDeferredPrompt(null);
      setShowInstallPrompt(false);

      // If user dismissed, save that information
      if (outcome === "dismissed") {
        setToStorage("installPromptDismissedAt", Date.now().toString());
      }
    } catch (error) {
      console.error("Error during install prompt:", error);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Save the dismissal time
    setToStorage("installPromptDismissedAt", Date.now().toString());
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  if (isStandalone || !showInstallPrompt) {
    return null; // Don't show install button if already installed or shouldn't show
  }

  // For iOS devices, show manual install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Install MyPal Ops App now
              </h3>
              <p className="text-sm text-gray-600">
                Add to your home screen for quick access
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          To install this app on your iOS device:
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>
              Tap the share button <span className="text-lg">⎋</span>
            </li>
            <li>
              Select &quot;Add to Home Screen&quot;{" "}
              <span className="text-lg">➕</span>
            </li>
          </ol>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="w-full"
        >
          Got it
        </Button>
      </div>
    );
  }

  // For non-iOS devices with deferred prompt
  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-auto max-w-md bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <Download className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Install MyPal Ops App</h3>
            <p className="text-sm text-gray-600">
              Get quick access from your home screen
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="flex-1"
        >
          Not Now
        </Button>
        <Button
          onClick={handleInstallClick}
          size="sm"
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          Install
        </Button>
      </div>
    </div>
  );
}
