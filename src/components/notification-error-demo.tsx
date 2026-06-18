"use client";

import NotificationGuidance from "@/components/notification-guidance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrowserInfo, getPushSupportStatus } from "@/config/firebase";
import { useState } from "react";

export function NotificationErrorDemo() {
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: "brave",
      title: "Brave Browser Privacy Settings",
      guidance: {
        title: "Brave Browser Privacy Settings",
        message: "Brave's privacy features are blocking push notifications.",
        steps: [
          "Click the Brave Shields icon (🛡️) in the address bar",
          "Turn OFF 'Block fingerprinting'",
          "Refresh the page and try again",
          "Alternative: Allow notifications in Brave Settings > Privacy and Security",
        ],
        canRetry: true,
      },
    },
    {
      id: "ios",
      title: "iOS Safari Limitation",
      guidance: {
        title: "iOS Safari Limitation",
        message:
          "Push notifications are not supported in iOS Safari. You can still use all other app features.",
        steps: [
          "Use Chrome or Firefox on iOS for notification support",
          "Or add this website to your home screen (it will work like an app)",
        ],
        canRetry: false,
      },
    },
    {
      id: "permission",
      title: "Permission Denied",
      guidance: {
        title: "Notification Permission Denied",
        message: "Notifications were blocked by your browser settings.",
        steps: [
          "Click the lock/info icon (🔒) next to the website address",
          "Change notifications from 'Block' to 'Allow'",
          "Refresh the page and try again",
          "Alternative: Check browser Settings > Privacy & Security > Notifications",
        ],
        canRetry: true,
      },
    },
    {
      id: "mobile",
      title: "Mobile Browser Limitation",
      guidance: {
        title: "Mobile Browser Limitation",
        message: "This mobile browser doesn't support push notifications.",
        steps: [
          "Try using Chrome, Firefox, or Samsung Internet browser",
          "All other app features work normally without notifications",
        ],
        canRetry: false,
      },
    },
  ];

  const browserInfo = getBrowserInfo();
  const supportStatus = getPushSupportStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Error Handling Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Current Browser Info:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>Browser:</strong> {browserInfo.name}
                </li>
                <li>
                  <strong>Is Mobile:</strong>{" "}
                  {browserInfo.isMobile ? "Yes" : "No"}
                </li>
                <li>
                  <strong>Is iOS:</strong> {browserInfo.isIOS ? "Yes" : "No"}
                </li>
                <li>
                  <strong>Is Brave:</strong>{" "}
                  {browserInfo.isBrave ? "Yes" : "No"}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Push Support Status:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>Supported:</strong>{" "}
                  {supportStatus.supported ? "Yes" : "No"}
                </li>
                {supportStatus.reason && (
                  <li>
                    <strong>Reason:</strong> {supportStatus.reason}
                  </li>
                )}
                {supportStatus.userGuidance && (
                  <li>
                    <strong>Has Guidance:</strong> Yes
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">
              Test Different Error Scenarios:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {scenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant={
                    currentScenario === scenario.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setCurrentScenario(scenario.id)}
                >
                  {scenario.title}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScenario(null)}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show actual browser guidance if available */}
      {supportStatus.userGuidance && !currentScenario && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Actual Browser Guidance:
          </h3>
          <NotificationGuidance
            userGuidance={supportStatus.userGuidance}
            onRetry={() => console.log("Retry clicked")}
            onDismiss={() => console.log("Dismiss clicked")}
          />
        </div>
      )}

      {/* Show demo scenario */}
      {currentScenario && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Demo Scenario:</h3>
          <NotificationGuidance
            userGuidance={
              scenarios.find((s) => s.id === currentScenario)?.guidance
            }
            onRetry={() => console.log("Demo retry clicked")}
            onDismiss={() => setCurrentScenario(null)}
          />
        </div>
      )}
    </div>
  );
}

export default NotificationErrorDemo;
