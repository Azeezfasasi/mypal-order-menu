"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { API_BASE_URL, ENDPOINTS } from "@/services/api/endpoints";

// Zod schema for password setup
const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

export default function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check for invalid parameters
  useEffect(() => {
    if (!token || !email) {
      setError("Invalid or missing invite link. Please check your email.");
    }
  }, [token, email]);

  const onSubmit = async (values: AcceptInviteFormValues) => {
    if (!token || !email) {
      setError("Invalid invite parameters");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.BUSINESS_TEAM.ACCEPT_INVITE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            email,
            password: values.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to accept invite and set password"
        );
      }

      setSuccess(true);
      toast.success("Password set successfully! Redirecting...");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Set Your Password</h1>
          <p className="text-muted-foreground">
            You&rsquo;ve been invited to join the team. Set a strong password to get started.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
          {error && !success && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Success!
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been set successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Display */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{email}</p>
                </div>

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter a strong password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <p>Password must contain:</p>
                        <ul className="list-disc list-inside">
                          <li>At least 8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One lowercase letter</li>
                          <li>One number</li>
                          <li>One special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !token || !email}
                  className="w-full bg-orange-600 hover:bg-orange-700 h-10"
                >
                  {isLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin inline-block">
                      ⏳
                    </span>
                  )}
                  Set Password & Continue
                </Button>
              </form>
            </Form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}
