"use client";

import NotificationGuidance from "@/components/notification-guidance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isMessagingSupportedAsync,
  PushSupportInfo,
  resetFcmTokenPromise,
} from "@/config/firebase";
import {
  AlertTriangle,
  Bell,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface NotificationWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableNotifications: () => Promise<{
    success: boolean;
    userGuidance?: PushSupportInfo["userGuidance"];
    error?: Error;
  }>;
}

export function NotificationWelcomeModal({
  isOpen,
  onClose,
  onEnableNotifications,
}: NotificationWelcomeModalProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [showRetryOptions, setShowRetryOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [userGuidance, setUserGuidance] =
    useState<PushSupportInfo["userGuidance"]>();

  const handleEnable = async () => {
    setIsEnabling(true);
    setErrorMessage(""); // Clear previous errors
    setUserGuidance(undefined); // Clear previous guidance

    try {
      const result = await onEnableNotifications();
      if (result.success) {
        // Success - modal will be closed by the parent component
        console.log("Notifications enabled successfully");
      } else {
        // Handle failure case
        console.error("Failed to enable notifications");
        if (result.userGuidance) {
          setUserGuidance(result.userGuidance);
        } else {
          setShowRetryOptions(true);
          setErrorMessage(
            "Failed to enable notifications. Please check the retry options below or your browser settings.",
          );
        }
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);

      // Provide specific guidance for common errors
      let errorMsg = "Failed to enable notifications. ";

      if (error instanceof Error) {
        if (
          error.message.includes("Registration failed - push service error") ||
          error.message.includes("AbortError")
        ) {
          errorMsg +=
            "This appears to be blocked by your browser's privacy settings. " +
            "If you're using Brave browser, please:\n\n" +
            "1. Click the Brave Shields icon (🛡️) in the address bar\n" +
            "2. Turn OFF 'Block fingerprinting'\n" +
            "3. Refresh the page and try again\n\n" +
            "For other browsers, check that notifications and push messaging are enabled in Settings.";
        } else if (error.message.includes("permission denied")) {
          errorMsg +=
            "Notification permission was denied. Please:\n\n" +
            "1. Click the lock/info icon in your address bar\n" +
            "2. Allow notifications for this site\n" +
            "3. Refresh the page and try again";
        } else if (error.message.includes("not supported")) {
          errorMsg +=
            "Push notifications are not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.";
        } else {
          errorMsg += `${error.message}\n\nPlease check your browser settings and try again.`;
        }
      } else {
        errorMsg += "Please check your browser settings and try again.";
      }

      setErrorMessage(errorMsg);
      setShowRetryOptions(true);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleRetryWithCacheClear = async () => {
    // Clear any cached FCM token promises
    resetFcmTokenPromise();

    // Clear service worker registrations
    if (await isMessagingSupportedAsync()) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log("Service worker registrations cleared");
      } catch (error) {
        console.error("Failed to clear service worker registrations:", error);
      }
    }

    // Re-register service worker
    if (await isMessagingSupportedAsync()) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("Service worker re-registered after cache clear");
      } catch (error) {
        console.error("Failed to re-register service worker:", error);
      }
    }

    // Reset state and try enabling notifications again
    setShowRetryOptions(false);
    setErrorMessage("");
    await handleEnable();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl md:max-w-xl sm:max-w-lg max-h-[80vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Bell className="h-6 w-6 text-blue-600" />
            <span>Welcome to MyPal Business!</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Important Setup Required</span>
              </div>
              <h2 className="text-2xl md:text-xl font-bold text-gray-900">
                Stay Connected with Your Business
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                Enable push notifications to never miss important updates,
                orders, or customer interactions that drive your business
                forward.
              </p>
            </div>

            {/* Business Benefits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">
                        Revenue Growth
                      </h4>
                      <p className="text-sm text-green-700">
                        Get instant alerts for new orders and bookings to
                        maximize your revenue potential.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Customer Service
                      </h4>
                      <p className="text-sm text-blue-700">
                        Respond to customer inquiries and reviews instantly to
                        build better relationships.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">
                        Time Management
                      </h4>
                      <p className="text-sm text-purple-700">
                        Never miss deadlines, events, or time-sensitive business
                        opportunities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900">
                        Business Insights
                      </h4>
                      <p className="text-sm text-orange-700">
                        Receive performance reports and analytics to optimize
                        your business operations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">
                Businesses with notifications enabled see:
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-1 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">40%</div>
                  <div className="text-sm text-gray-600">
                    Faster response time
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">25%</div>
                  <div className="text-sm text-gray-600">
                    More customer engagement
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">30%</div>
                  <div className="text-sm text-gray-600">
                    Higher revenue growth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex-shrink-0 p-4 border-t bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row md:flex-col gap-3">
              <Button
                onClick={handleEnable}
                disabled={isEnabling}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isEnabling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enabling Notifications...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Business Notifications
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Skip for Now
              </Button>
            </div>

            {/* Enhanced Error Guidance */}
            {userGuidance && (
              <div className="pt-2 border-t">
                <NotificationGuidance
                  userGuidance={userGuidance}
                  onRetry={userGuidance.canRetry ? handleEnable : undefined}
                  onDismiss={onClose}
                  isRetrying={isEnabling}
                />
              </div>
            )}

            {/* Fallback Error Message Display */}
            {errorMessage && !userGuidance && (
              <div className="pt-2 border-t">
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-1">
                        Notification Setup Failed
                      </div>
                      <div className="whitespace-pre-line">{errorMessage}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Retry Options - Show after failure */}
            {showRetryOptions && !userGuidance && (
              <div className={`${errorMessage ? "" : "pt-2 border-t"}`}>
                <p className="text-sm text-gray-600 mb-2">
                  Having trouble? Try these options:
                </p>
                <Button
                  onClick={handleRetryWithCacheClear}
                  disabled={isEnabling}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache & Retry
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            You can change notification preferences anytime in Settings →
            Notifications
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
