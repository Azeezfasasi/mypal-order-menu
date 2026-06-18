/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BusinessAuthState, processBusinessAuth } from "@/lib/auth-flow-utils";
import { pickBusiness } from "@/lib/utils";
import { interpretAuthError, AuthErrorInfo } from "@/lib/auth-error-handler";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { getAuthActions } from "@/stores/auth-store";
import { IBusiness } from "@/types/auth-types";

const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<AuthErrorInfo | null>(null); // Structured error state

  // Get auth actions from our store
  const { setSession } = getAuthActions();

  const { mutateAsync: signinMutation } = BusinessAuthApi.useSignin();
  const { mutateAsync: resendOtpMutation } = BusinessAuthApi.useResendOtp();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Check if user just completed verification
    const justVerified = sessionStorage.getItem("justVerified");
    if (justVerified === "true") {
      setShowSuccessAlert(true);
      sessionStorage.removeItem("justVerified");

      // Auto-hide the alert after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Handles business authentication status after login
   * Uses centralized auth flow logic from /lib/auth-flow-utils.ts
   *
   * This function:
   * 1. Determines the business's auth state (needs OTP, needs KYB, or fully authenticated)
   * 2. Sets the appropriate session token type
   * 3. Shows user-friendly messages
   * 4. Sends OTP if verification is needed
   * 5. Redirects to the correct next step
   */
  async function handleBusinessStatus(responseData: any) {

    // --- for team member ---
    if (responseData.member?.role.name) {
      localStorage.setItem("member-role", responseData.member.role.name)
    } else {
      // --- for superadmin ---
      localStorage.removeItem("member-role");
    }

    const business: IBusiness | undefined =
      responseData.business || responseData.data?.business || responseData;
    const access_token: string | undefined =
      responseData.access_token || responseData.data?.access_token;

    if (!business) {
      toast.error("Login Error", {
        description: "Unable to process login response. Please try again.",
      });
      return;
    }

    const minimal = pickBusiness(business, access_token || "");

    // If the API returned linked businesses at the outer response level
    // (many responses include `linkedBusinesses` alongside `business`),
    // preserve them into the minimal stored business so the UI can show
    // account-switch targets.
    const linkedBusinesses =
      responseData.linkedBusinesses || responseData.data?.linkedBusinesses;
    if (Array.isArray(linkedBusinesses)) {
      minimal.linkedBusinesses = linkedBusinesses.map((lb: any) => ({
        id: lb.id,
        business_name: lb.business_name,
        image_url: lb.image_url ?? null,
        category: lb.category
          ? { id: lb.category.id, name: lb.category.name }
          : { id: "", name: "" },
        is_primary: lb.is_primary ?? false,
      }));
    }

    // Use the centralized auth flow logic - this replaces ~60 lines of complex conditional logic
    const authFlow = processBusinessAuth(business, access_token || "");

    console.log("Auth flow result:", authFlow);

    // Set session if we have valid token and business data
    if (authFlow.shouldSetSession && access_token) {
      setSession(access_token, authFlow.tokenType, minimal);
      toast.success('Session set');
    }

    // Send OTP for verification flow if needed, with combined messaging
    if (authFlow.redirectPath === "/verify" && business.email) {
      try {
        console.log("Sending OTP to", business.email);
        // Use structured messaging with frontend context and backend details
        toast.promise(resendOtpMutation(business.email), {
          loading: "Sending verification code...",
          success: (data) => {
            return {
              message: authFlow.message,
              description:
                data.data.message ||
                "OTP sent to your email. Please check your inbox.",
            };
          },
          error: (error) => {
            console.error("Failed to send OTP:", error);
            return {
              message: "Failed to send verification code",
              description: error.message || "Please try again.",
            };
          },
        });

      } catch (error) {
        console.error("Failed to send OTP:", error);
        // Show the auth message as fallback if OTP sending fails
        toast.info(authFlow.message, {
          description: "Please proceed to the verification page manually.",
        });
      }
    } else {
      // Show appropriate message for non-OTP flows
      const titles: Record<BusinessAuthState, string> = {
        [BusinessAuthState.NEEDS_OTP_VERIFICATION]:
          "Account Verification Required",
        [BusinessAuthState.NEEDS_KYB_COMPLETION]: "Business Profile Required",
        [BusinessAuthState.AWAITING_VERIFICATION]: "KYB Under Review",
        [BusinessAuthState.FULLY_AUTHENTICATED]: "Welcome Back!",
        [BusinessAuthState.INVALID_CREDENTIALS]: "Account Status",
      };

      const title = titles[authFlow.authState] || "Account Status";

      toast.info(title, {
        description: authFlow.message,
      });
    }

    // Navigate to the appropriate page
    console.log("Redirecting to", authFlow.redirectPath);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    router.replace(authFlow.redirectPath);
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setErrorAlert(null); // clear previous error
    try {
      // DEBUG: Log the request details
      console.log("🔐 [LOGIN] Starting signin request with:", {
        email: data.email,
        env: process.env.NODE_ENV,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || "USING DEFAULT",
      });

      const response = await signinMutation({
        email: data.email,
        password: data.password,
      });

      // Handle successful login with centralized logic
      if (response.data?.access_token && response.data?.business) {
        // Pass the full response.data so any top-level fields like
        // `linkedBusinesses` or other metadata are available to
        // `handleBusinessStatus` instead of only passing business/token.
        await handleBusinessStatus(response.data);
      } else {
        toast.error("Login Error", {
          description: "Unable to process login response. Please try again.",
        });
      }
    } catch (error: any) {
      console.log("Login error:", error);
      console.log("Error response data:", error.response?.data);
      console.error("❌ [LOGIN] Full error object:", {
        message: error?.message,
        code: error?.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        requestUrl: `${error.config?.baseURL}${error.config?.url}`,
      });

      // Check if the error indicates a business not initialized case
      // Normalize error message for comparison
      const errorMsgRaw = error.response?.data?.message ?? "";
      const errorMsgNorm = errorMsgRaw.toLowerCase().trim();
      if (
        error.response?.data?.statusCode === 403 &&
        errorMsgNorm === "business not initialized" &&
        error.response?.data?.data
      ) {
        console.log("Detected business not initialized case");
        await handleBusinessStatus(error.response.data.data);
      } else {
        // Use the new error interpreter for user-friendly messages
        const errorInfo = interpretAuthError(error, "login");
        setErrorAlert(errorInfo);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {showSuccessAlert && (
        <Alert className="flex items-center justify-between border-l-4 border-l-green-600 bg-green-50 text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription>Account created successfully.</AlertDescription>
          </div>
          <button
            onClick={() => setShowSuccessAlert(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {errorAlert && (
        <Alert className="flex items-start justify-between border-l-4 border-l-red-600 bg-red-50 text-red-800 animate-in fade-in duration-300 p-4">
          <div className="flex items-start gap-3 flex-1">
            <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-red-900">{errorAlert.title}</p>
              <AlertDescription className="text-red-800">
                {errorAlert.message}
              </AlertDescription>
              {errorAlert.suggestion && (
                <p className="text-xs text-red-700 italic mt-2">
                  💡 <strong>Tip:</strong> {errorAlert.suggestion}
                </p>
              )}
              {errorAlert.details && (
                <p className="text-xs text-red-700 bg-red-100 p-2 rounded mt-2">
                  {errorAlert.details}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setErrorAlert(null)}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div>
        <h2 className="text-2xl font-bold">Log in</h2>
        <p className="text-sm text-gray-600">MyPal business Admin Panel</p>
        <p className="mt-2 text-sm text-gray-500">
          Welcome back, please enter the details correctly to sign in.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter Password"
                      type={showPassword ? "text" : "password"}
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="text-right mt-2">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </Form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
