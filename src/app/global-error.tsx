"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const handleReload = () => {
    window.location.href = "/";
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Critical Error
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  A critical error occurred that prevented the application from
                  loading properly.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">
                      Error Details (Development Only)
                    </h4>
                    <p className="text-xs text-red-700 font-mono break-all">
                      {error.message}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-red-600 mt-1">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                )}

                {/* Critical error message */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">
                    What happened?
                  </h4>
                  <p className="text-sm text-orange-700">
                    The application encountered a critical error and needs to be
                    restarted. This could be due to a network issue, server
                    problem, or corrupted data.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Recommended actions:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Reload the application</li>
                    <li>• Check your internet connection</li>
                    <li>• Clear your browser cache</li>
                    <li>• Contact support if the issue persists</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-6">
                <Button
                  onClick={reset}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReload}
                  className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Reload Application
                </Button>
              </CardFooter>
            </Card>

            {/* Emergency Contact */}
            <div className="text-center mt-6 space-y-2">
              <p className="text-sm text-gray-500">
                Critical error? Need immediate help?
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="mailto:helpdesk@mypal-inc.com"
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  Email Support
                </a>
                <span className="text-gray-300">|</span>
                <a
                  href="tel:+1234567890"
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
