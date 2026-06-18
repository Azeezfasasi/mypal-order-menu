"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Label } from "../ui/label";

const schema = z.object({
  old_password: z.string().min(6, "Old password is required"),
  new_password: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

type FormData = z.infer<typeof schema>;

export default function ChangePasswordTab() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const changePasswordMutation = BusinessAuthApi.useChangePassword();

  const onSubmit = async (data: FormData) => {
    await changePasswordMutation.mutateAsync(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md mx-auto"
    >
      <div>
        <Label className="block mb-1 font-medium">Old Password</Label>
        <Input
          type={showPassword ? "text" : "password"}
          {...register("old_password")}
          autoComplete="current-password"
        />
        {errors.old_password && (
          <p className="text-red-500 text-xs mt-1">
            {errors.old_password.message}
          </p>
        )}
      </div>
      <div>
        <Label className="block mb-1 font-medium">New Password</Label>
        <Input
          type={showPassword ? "text" : "password"}
          {...register("new_password")}
          autoComplete="new-password"
        />
        {errors.new_password && (
          <p className="text-red-500 text-xs mt-1">
            {errors.new_password.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id="show-password"
          type="checkbox"
          checked={showPassword}
          onChange={() => setShowPassword((v) => !v)}
        />
        <Label htmlFor="show-password" className="text-sm">
          Show Passwords
        </Label>
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || changePasswordMutation.isPending}
      >
        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
