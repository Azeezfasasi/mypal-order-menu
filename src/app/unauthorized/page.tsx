"use client";

import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-green-100/50 to-green-50 p-6">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 text-center shadow-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>

        <p className="text-gray-600">
          You don&apos;t have permission to access this page. Please log in with
          the appropriate credentials.
        </p>

        <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Button
            className="bg-san-felix-900 hover:bg-camarone-900 flex items-center gap-2 text-white"
            onClick={() => router.push("/signin")}
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
