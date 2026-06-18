"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PushSupportInfo } from "@/config/firebase";
import { AlertTriangle, Info, Shield, Smartphone, Zap } from "lucide-react";

interface NotificationGuidanceProps {
  userGuidance: PushSupportInfo["userGuidance"];
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
}

export function NotificationGuidance({
  userGuidance,
  onRetry,
  onDismiss,
  isRetrying = false,
}: NotificationGuidanceProps) {
  if (!userGuidance) return null;

  const getIcon = () => {
    if (userGuidance.title.includes("Brave")) {
      return <Shield className="h-6 w-6 text-orange-600" />;
    }
    if (userGuidance.title.includes("iOS")) {
      return <Smartphone className="h-6 w-6 text-blue-600" />;
    }
    if (userGuidance.title.includes("Permission")) {
      return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
    if (userGuidance.title.includes("Configuration")) {
      return <Zap className="h-6 w-6 text-purple-600" />;
    }
    return <Info className="h-6 w-6 text-blue-600" />;
  };

  const getCardStyle = () => {
    if (userGuidance.title.includes("Brave")) {
      return "border-orange-200 bg-orange-50";
    }
    if (userGuidance.title.includes("iOS")) {
      return "border-blue-200 bg-blue-50";
    }
    if (userGuidance.title.includes("Permission")) {
      return "border-red-200 bg-red-50";
    }
    if (userGuidance.title.includes("Configuration")) {
      return "border-purple-200 bg-purple-50";
    }
    return "border-blue-200 bg-blue-50";
  };

  const getTextColor = () => {
    if (userGuidance.title.includes("Brave")) return "text-orange-900";
    if (userGuidance.title.includes("iOS")) return "text-blue-900";
    if (userGuidance.title.includes("Permission")) return "text-red-900";
    if (userGuidance.title.includes("Configuration")) return "text-purple-900";
    return "text-blue-900";
  };

  const getStepColor = () => {
    if (userGuidance.title.includes("Brave")) return "text-orange-800";
    if (userGuidance.title.includes("iOS")) return "text-blue-800";
    if (userGuidance.title.includes("Permission")) return "text-red-800";
    if (userGuidance.title.includes("Configuration")) return "text-purple-800";
    return "text-blue-800";
  };

  return (
    <Card className={`${getCardStyle()} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center space-x-2 ${getTextColor()}`}>
          {getIcon()}
          <span>{userGuidance.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`font-medium ${getTextColor()}`}>
          {userGuidance.message}
        </p>

        <div className="space-y-2">
          <h4 className={`font-semibold ${getTextColor()}`}>
            How to fix this:
          </h4>
          <ol
            className={`list-decimal list-inside space-y-1.5 text-sm ${getStepColor()}`}
          >
            {userGuidance.steps.map((step, index) => (
              <li key={index} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Special section for Brave browser */}
        {userGuidance.title.includes("Brave") && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mt-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-800">
                <p className="font-semibold mb-1">Why does Brave block this?</p>
                <p>
                  Brave&apos;s privacy features block fingerprinting and
                  tracking by default. While this protects your privacy, it also
                  prevents legitimate notifications. You can safely allow
                  notifications for this business app.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Special section for iOS Safari */}
        {userGuidance.title.includes("iOS") && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-4">
            <div className="flex items-start space-x-2">
              <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">iOS Safari Limitation</p>
                <p>
                  Apple doesn&apos;t allow web push notifications in iOS Safari.
                  This is a platform limitation, not an issue with our app. All
                  other features work perfectly!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {userGuidance.canRetry && onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex-1"
              size="sm"
            >
              {isRetrying ? "Trying..." : "Try Again"}
            </Button>
          )}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              {userGuidance.canRetry ? "Skip for Now" : "Got It"}
            </Button>
          )}
        </div>

        {/* Additional help text */}
        <p className="text-xs text-gray-600 text-center mt-3">
          {userGuidance.canRetry
            ? "Don&apos;t worry - you can enable notifications later in Settings if needed."
            : "All other app features work normally without notifications."}
        </p>
      </CardContent>
    </Card>
  );
}

export default NotificationGuidance;
