"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Log specific notification-related errors
    if (error.message.includes("Notification")) {
      console.error("Notification API error caught:", {
        message: error.message,
        stack: error.stack,
        errorInfo,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        notificationSupport:
          typeof window !== "undefined" && "Notification" in window,
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.handleReset}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                We encountered an unexpected error. Don&apos;t worry, our team
                has been notified.
              </p>

              {/* Show user-friendly error message for notification issues */}
              {this.state.error?.message.includes("Notification") && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Notification Issue:</strong> This appears to be
                    related to push notifications. Your device or browser may
                    not support this feature, but you can still use the app
                    normally.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">What can you do?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Go back to the previous page</li>
                  <li>• Return to the dashboard</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Need help? Contact Support
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
