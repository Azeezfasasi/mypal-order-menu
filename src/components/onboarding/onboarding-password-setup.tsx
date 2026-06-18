"use client";

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
import { IOnboardingTokenData } from "@/types/onboarding-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const passwordSchema = z
  .object({
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface OnboardingPasswordSetupProps {
  businessData: IOnboardingTokenData;
  isSubmitting: boolean;
  onSubmit: (password: string) => Promise<void>;
  onCancel: () => void;
}

export default function OnboardingPasswordSetup({
  businessData,
  isSubmitting,
  onSubmit,
  onCancel,
}: OnboardingPasswordSetupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong"
  >("weak");

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const checkPasswordStrength = (password: string) => {
    let strength = 0;

    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength("weak");
    else if (strength <= 3) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  };

  const handlePasswordChange = (value: string) => {
    checkPasswordStrength(value);
    form.setValue("password", value);
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case "weak":
        return "Weak";
      case "medium":
        return "Medium";
      case "strong":
        return "Strong";
    }
  };

  async function handleSubmit(data: PasswordFormValues) {
    try {
      await onSubmit(data.password);
    } catch (error) {
      console.error("Password setup error:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Business Info Preview */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
          <p className="text-sm font-medium text-blue-900">Business Account</p>
          <p className="text-sm text-blue-800">{businessData.business_name}</p>
          <p className="text-xs text-blue-700">{businessData.email}</p>
        </div>

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    onChange={(e) => {
                      handlePasswordChange(e.target.value);
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>

              {/* Password Strength Indicator */}
              {field.value && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor()} transition-all`}
                        style={{
                          width:
                            passwordStrength === "weak"
                              ? "33%"
                              : passwordStrength === "medium"
                                ? "66%"
                                : "100%",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {getStrengthLabel()}
                    </span>
                  </div>
                </div>
              )}

              <FormMessage />
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
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...field}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Requirements */}
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            Password Requirements:
          </p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  form.getValues("password").length >= 8
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              At least 8 characters
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  /[A-Z]/.test(form.getValues("password"))
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              One uppercase letter
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  /[a-z]/.test(form.getValues("password"))
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              One lowercase letter
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  /\d/.test(form.getValues("password"))
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              One number
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  /[^A-Za-z0-9]/.test(form.getValues("password"))
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
              One special character
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Setting Password..." : "Set Password & Continue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
