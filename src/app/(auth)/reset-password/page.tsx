"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { usePasswordResetSession } from "@/hooks/useVerificationSession";
import { handlePasswordResetSuccess } from "@/lib/auth-flow-utils";
import { pickBusiness } from "@/lib/utils";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { getAuthActions } from "@/stores/auth-store";

const resetPasswordSchema = z
  .object({
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    code: z.string().min(4, {
      message: "Reset code must be at least 4 characters.",
    }),
    new_password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[!@$%&*\-_+=]/, {
        message: "Password must contain at least one special character (!@$%&*-_+=).",
      }),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@$%&*\-_+=]/.test(password),
  };
};

const PasswordRequirementItem = ({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <div
      className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${
        met
          ? "border-green-500 bg-green-50"
          : "border-gray-300 bg-gray-50"
      }`}
    >
      {met && <Check className="h-3 w-3 text-green-600" />}
    </div>
    <span className={met ? "text-gray-700" : "text-gray-500"}>{text}</span>
  </div>
);

export default function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] =
    useState<PasswordRequirements>({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
    });

  // Session validation using the new hook
  const {
    isInitialized,
    isValid,
    isLoading: sessionLoading,
  } = usePasswordResetSession();

  // Get auth actions from our store
  const { setSession } = getAuthActions();

  const {
    mutate: resetPassword,
    isPending,
    isSuccess,
  } = BusinessAuthApi.useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Get email from session storage if available
  useEffect(() => {
    const email = sessionStorage.getItem("resetEmail");
    if (email) {
      form.setValue("email", email);
    }
  }, [form]);

  function onSubmit(data: ResetPasswordFormValues) {
    resetPassword(
      {
        email: data.email,
        code: data.code,
        new_password: data.new_password,
      },
      {
        onSuccess: (response) => {
          // Clear session storage
          sessionStorage.removeItem("resetEmail");

          // Use centralized logic to determine where to redirect
          const resetFlow = handlePasswordResetSuccess(
            response.data?.business,
            response.data?.access_token,
          );

          // Set session if we have valid token and business data
          if (resetFlow.shouldSetSession && response.data?.access_token && response.data?.business) {
            setSession(
              response.data.access_token,
              resetFlow.tokenType,
              pickBusiness(response.data.business, response.data.access_token),
            );
          }

          // Navigate to the appropriate page after a short delay
          // The success message will be shown by the isSuccess alert
          setTimeout(() => {
            router.push(resetFlow.redirectPath);
          }, 2000);
        },
      },
    );
  }

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

  // Password reset is more lenient - allow users to access even without perfect session
  // They might be coming from email links or have expired intermediate sessions
  if (!isValid) {
    // Still allow access but show a subtle warning
    console.log(
      "Password reset accessed without valid session - this is allowed",
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <p className="text-sm text-gray-600">MyPal business Admin Panel</p>
        <p className="mt-2 text-sm text-gray-500">
          Enter the code sent to your email along with your new password.
        </p>
      </div>

      {isSuccess ? (
        <Alert className="bg-green-50 border-green-100">
          <AlertDescription className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>
              Your password has been reset successfully! Redirecting...
            </span>
          </AlertDescription>
        </Alert>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the 4-digit code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter new password"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setPasswordRequirements(
                            checkPasswordRequirements(e.target.value)
                          );
                        }}
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
                  <div className="flex flex-wrap items-center justify-start gap-4 lg:gap-3 mt-3 space-y-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <PasswordRequirementItem
                      met={passwordRequirements.minLength}
                      text="At least 8 letters"
                    />
                    <PasswordRequirementItem
                      met={passwordRequirements.hasUppercase}
                      text="1 Capital Letter"
                    />
                    <PasswordRequirementItem
                      met={passwordRequirements.hasSpecial}
                      text="1 Symbol"
                    />
                    <PasswordRequirementItem
                      met={passwordRequirements.hasNumber}
                      text="1 Number"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Special characters allowed: ! @ $ % & * - _ + =
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Confirm new password"
                        type={showConfirmPassword ? "text" : "password"}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
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
              disabled={isPending}
            >
              {isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      )}

      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
