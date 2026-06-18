"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OtpInputGroup } from "@/components/ui/otp-input";
import { useOtpSession } from "@/hooks/useVerificationSession";
import { processBusinessAuth } from "@/lib/auth-flow-utils";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";

export default function VerifyForm() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(4).fill(""));
  // 2 minutes (120 seconds) countdown for OTP
  const [timeLeft, setTimeLeft] = useState(120);
  const [isLoading, setIsLoading] = useState(false);

  // Get data from auth store
  const business = useAuthStore((state) => state.business);
  const actions = useAuthStore((state) => state.actions);

  // Session validation using the new hook
  const { isInitialized, isValid, isLoading: sessionLoading } = useOtpSession();

  // Email from the store
  const email = business?.email || "";

  const { useVerifyOtp, useResendOtp } = BusinessAuthApi;

  const { mutate: verifyOtpMutation } = useVerifyOtp();
  const { mutate: resendOtpMutation } = useResendOtp();

  // Timer effect
  useEffect(() => {
    // Start countdown timer (1s tick)
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // When reaching 0 ensure timer is cleared and value stays at 0
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty dependency array so it only runs once

  const resendOtp = useCallback(() => {
    // Reset OTP fields
    setOtp(Array(4).fill(""));

    // Reset timer
    setTimeLeft(120);

    // Call resend OTP mutation
    if (email) {
      resendOtpMutation(email, {
        onSuccess: () => {
          toast.success("OTP resent successfully", {
            description:
              "Please check your email for the new verification code.",
          });
        },
        onError: (error) => {
          toast.error("Failed to resend OTP", {
            description:
              error.response?.data?.message || "Please try again later.",
          });
          console.error("Resend OTP error:", error);
        },
      });
    }
  }, [email, resendOtpMutation]);

  const verifyOtp = useCallback(() => {
    const otpValue = otp.join("");

    // Check if OTP is complete
    if (otpValue.length !== 4) {
      toast.error("Incomplete OTP", {
        description: "Please enter the complete 4-digit OTP",
      });
      return;
    }

    setIsLoading(true);

    // Get user_id from business object
    const userId = business?.id || "";

    // Verify OTP with API
    verifyOtpMutation(
      {
        user_id: userId,
        code: otpValue,
      },
      {
        onSuccess: (data) => {
          // After OTP verification, determine where to redirect based on business state
          const token = data.data?.access_token;
          const business = data.data?.business;

          // Validate token is present and properly formatted
          if (!token || typeof token !== "string" || token.trim().length === 0) {
            toast.error("Invalid response from server", {
              description: "No authentication token received. Please try again.",
            });
            console.error("Invalid token from OTP verification:", {
              hasToken: !!token,
              tokenType: typeof token,
              tokenLength: token?.length || 0,
            });
            setIsLoading(false);
            return;
          }

          if (!business || typeof business !== "object") {
            toast.error("Invalid response from server", {
              description: "No business data received. Please try again.",
            });
            console.error("Invalid business data from OTP verification:", {
              hasBusiness: !!business,
              businessType: typeof business,
            });
            setIsLoading(false);
            return;
          }

          const authFlow = processBusinessAuth(business, token);

          // Set session with the appropriate token type
          // Token is automatically prefixed with "Bearer " if needed by the interceptor
          actions.setSession(token, authFlow.tokenType, business);

          // Set flag for successful verification
          sessionStorage.setItem("justVerified", "true");

          // Show success message with next step context
          toast.success("Account verified", {
            description:
              "Your account has been verified successfully. Redirecting to next step...",
          });

          console.log("Verify OTP successful, redirecting to:", authFlow.redirectPath);
          // Navigate to the appropriate next step
          // router.push(authFlow.redirectPath);
          router.push('/delegate');
        },
        onError: (error) => {
          toast.error("Verification failed", {
            description: error.response?.data?.message || "Please try again",
          });
          setIsLoading(false);
        },
        onSettled: () => {
          setIsLoading(false);
        },
      },
    );
  }, [otp, business, verifyOtpMutation, actions, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show loading state while session is initializing
  if (!isInitialized || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If session is invalid, the hook will handle redirects
  if (!isValid) {
    return null;
  }

  // If no email, show a more helpful message instead of blank page
  if (!email) {
    return (
      <div className="space-y-6 w-full px-4 sm:px-6 md:px-8 max-w-lg mx-auto">
        <div>
          <h2 className="text-2xl font-bold">Account Verification</h2>
          <p className="text-sm text-gray-600">MyPal business Admin Panel</p>
        </div>
        <Alert variant="destructive" className="bg-red-50 border-red-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>We couldn&apos;t find your email address in the session.</p>
              <p>This usually happens when:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Your session has expired</li>
                <li>You refreshed the page after a long time</li>
                <li>Browser data was cleared</li>
              </ul>
              <p className="font-medium">
                Please go back to login or signup to continue.
              </p>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex space-x-4">
          <Button
            onClick={() => router.push("/login")}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Go to Login
          </Button>
          <Button
            onClick={() => router.push("/signup")}
            variant="outline"
            className="flex-1"
          >
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 md:px-8 max-w-lg mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Kindly verify your account</h2>
        <p className="text-sm text-gray-600">MyPal business Admin Panel</p>
        <div className="mt-2 text-sm text-gray-700">
          <p>An OTP code has been sent to the email you provided,</p>
          <p className="font-semibold">{email}</p>
          <p>Enter the 4-digit OTP below to verify your account</p>
        </div>
      </div>

      <div className="space-y-4">
        <OtpInputGroup value={otp} onChange={setOtp} length={4} />

        <div className="flex items-center justify-between text-sm">
          <span>{formatTime(timeLeft)}</span>
          <button
            type="button"
            onClick={resendOtp}
            disabled={timeLeft > 0}
            className="flex items-center text-primary disabled:text-gray-400"
          >
            Resend OTP
          </button>
        </div>

        <Alert variant="destructive" className="bg-red-50 border-red-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            If you haven’t received the email in your inbox, check your spam or
            junk folder.
          </AlertDescription>
        </Alert>

        <Button
          onClick={verifyOtp}
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Verify account"}
        </Button>

        <div className="text-center text-xs  text-gray-500">
          <span>MyPal </span>
          <Link href="#" className="text-gray-700 hover:underline">
            Privacy Policy
          </Link>
          <span> | </span>
          <Link href="#" className="text-gray-700 hover:underline">
            Terms of use
          </Link>
        </div>
      </div>
    </div>
  );
}
