"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { BusinessAuthApi } from "@/services/api/auth-api";

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: forgotPassword, isPending } =
    BusinessAuthApi.useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(data: ForgotPasswordFormValues) {
    forgotPassword(
      { email: data.email },
      {
        onSuccess: () => {
          setIsSuccess(true);
          // Store email in session storage for reset password page
          sessionStorage.setItem("resetEmail", data.email);
          // Navigate to reset password page after 2 seconds
          setTimeout(() => {
            router.push("/reset-password");
          }, 2000);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Forgot Password</h2>
        <p className="text-sm text-gray-600">MyPal business Admin Panel</p>
        <p className="mt-2 text-sm text-gray-500">
          Enter your email address below and we&rsquo;ll send you a code to
          reset your password.
        </p>
      </div>

      {isSuccess ? (
        <Alert className="bg-green-50 border-green-100">
          <AlertDescription className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            <span>
              Reset code sent! Please check your email and follow the
              instructions to reset your password. Redirecting to reset page...
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
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send Reset Code"}
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
