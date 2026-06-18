"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { interpretAuthError, AuthErrorInfo } from "@/lib/auth-error-handler";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { TokenType, getAuthActions, syncAuthStoreWithCookies, useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const signupFormSchema = z
  .object({
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

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
    hasSpecial: /[^A-Za-z0-9]/.test(password),
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

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorAlert, setErrorAlert] = useState<AuthErrorInfo | null>(null);
  const [passwordRequirements, setPasswordRequirements] =
    useState<PasswordRequirements>({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
    });

  // Get auth actions from our store
  const { setSession } = getAuthActions();

  const { mutateAsync: signup, isPending } = BusinessAuthApi.useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  async function onSubmit(data: SignupFormValues) {
    // Extract only the required fields for signup
    const { email, password } = data;
    setErrorAlert(null); // Clear previous errors

    await signup(
      { email, password },
      {
        onSuccess: (data) => {
          // After signup, business always needs OTP verification first
          console.log("Signup response:", data);
          if (data.data) {
            // The signup response may not include an access token initially
            // The token is typically issued after OTP verification
            const responseData = data.data as unknown as Record<string, unknown>;
            const token =
              (responseData.current_token as string) ||
              (responseData.access_token as string) ||
              "";

            // For OTP flow, we need the user ID even if we don't have a token yet
            const userId = (responseData.id as string) || "";
            const businessEmail = (responseData.email as string) || "";

            console.log("Signup data extracted:", {
              hasToken: !!token,
              hasUserId: !!userId,
              hasEmail: !!businessEmail,
            });

            if (!userId && !businessEmail) {
              toast.error("Signup Error", {
                description:
                  "Unable to create account. Missing required information.",
              });
              console.error("Signup response data:", data.data);
              return;
            }

            // For signup without immediate token, create a business object with what we have
            // Keep the response data as-is and just ensure critical fields are set
            const businessData = {
              ...data.data,
              email: businessEmail,
              id: userId,
              // If no token from signup, we'll get it after OTP verification
              current_token: token || (responseData.current_token as string) || "",
              access_token: token || (responseData.access_token as string) || "",
            };

            // Set session with the token if available, or just the business data
            if (token) {
              setSession(token, TokenType.VERIFY_OTP, businessData as never);
              // Sync store with cookies to ensure verification page can read the token
              syncAuthStoreWithCookies();
            } else {
              // No token yet - just store the business data and tokenType in store and cookies
              // The token will be issued after OTP verification
              if (typeof sessionStorage !== "undefined") {
                sessionStorage.setItem(
                  `otp_business_data`,
                  JSON.stringify(businessData),
                );
              }

              // Set tokenType cookie and store state without token
              // This allows the verify page to proceed even without a token
              if (typeof document !== "undefined") {
                // Manually set the tokenType cookie since we don't have a token
                document.cookie = `tokenType=${TokenType.VERIFY_OTP}; path=/; max-age=${60 * 15}`;
              }

              // Update store with tokenType and business data (no token)
              useAuthStore.setState({
                tokenType: TokenType.VERIFY_OTP,
                business: businessData as never,
              });
            }

            // Show success message
            toast.success("Account created successfully!", {
              description: "Redirecting to verification...",
            });

            // Immediately redirect to verify page
            router.push("/verify");
          } else {
            toast.error("Signup Error", {
              description: "Unable to process signup response. Please try again.",
            });
          }
        },
        onError: (error: unknown) => {
          // Use the new error interpreter for user-friendly messages
          const errorInfo = interpretAuthError(error, "signup");
          setErrorAlert(errorInfo);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sign up</h2>
        <p className="text-sm text-gray-600">MyPal business Admin Panel</p>
        <p className="mt-2 text-sm text-gray-500">
          Please enter the details below correctly to create an account.
        </p>
      </div>

      {errorAlert && (
        <Alert className="flex items-start justify-between border-l-4 border-l-red-600 bg-red-50 text-red-800 animate-in fade-in duration-300 p-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-red-600 flex-shrink-0 mt-0.5 text-lg">✕</span>
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
            <span className="text-lg">✕</span>
          </button>
        </Alert>
      )}

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
                      placeholder="Enter 8 characters or more"
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
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter 8 characters or more"
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

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    I accept MyPal terms and conditions of use
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isPending}
          >
            {isPending ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}
