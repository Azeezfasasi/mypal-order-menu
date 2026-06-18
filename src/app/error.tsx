"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Oops! Something went wrong
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              We encountered an unexpected error. Don&apos;t worry, our team has
              been notified.
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

            {/* User-friendly error message */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-primary-800 mb-2">
                What can you do?
              </h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Go back to the previous page</li>
                <li>• Return to the dashboard</li>
                <li>• Contact support if the problem persists</li>
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

            <div className="flex space-x-3 w-full">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button
                variant="outline"
                onClick={handleGoHome}
                className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a
              href="mailto:helpdesk@mypal-inc.com"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
