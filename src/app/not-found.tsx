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
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-primary-800 mb-2">
                What can you do?
              </h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>• Check the URL for typos</li>
                <li>• Go back to the previous page</li>
                <li>• Return to the dashboard</li>
                <li>• Use the search feature</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-6">
            <Link href="/" className="w-full">
              <Button className="w-full bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white font-medium">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardFooter>
        </Card>

        {/* Popular Pages */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/80 transition-colors"
            >
              <div className="text-xs font-medium text-gray-700">Dashboard</div>
            </Link>
            <Link
              href="/offerings"
              className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/80 transition-colors"
            >
              <div className="text-xs font-medium text-gray-700">Offerings</div>
            </Link>
            <Link
              href="/transactions"
              className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/80 transition-colors"
            >
              <div className="text-xs font-medium text-gray-700">
                Transactions
              </div>
            </Link>
            <Link
              href="/settings"
              className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/80 transition-colors"
            >
              <div className="text-xs font-medium text-gray-700">Settings</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
