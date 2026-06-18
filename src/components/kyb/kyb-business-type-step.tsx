"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKybStore, type BusinessType } from "@/stores/kyb-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  business_type: z.enum(["Unregistered", "Registered", "Incorporated"], {
    required_error: "Please select a business type.",
  }),
});

interface KybBusinessTypeStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isSubmitting?: boolean;
  isFromOnboarding?: boolean;
}

export default function KybBusinessTypeStep({
  onNext,
  isSubmitting,
  isFromOnboarding,
}: KybBusinessTypeStepProps) {
  const { businessProfile, updateBusinessProfile } = useKybStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_type: businessProfile.business_type || "Registered",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateBusinessProfile({
      business_type: values.business_type as BusinessType,
    });
    onNext();
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company profile</h1>
          <p className="mt-2 text-lg font-medium text-primary">
            One last thing.....
          </p>
          <p className="mt-1 text-gray-600">
            You are required to update your business profile by filling the KYB
            form, to help us serve you better
          </p>
        </div>

        {isFromOnboarding && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Some information has been prefilled from your onboarding. Please
              complete the remaining fields.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h2 className="text-lg font-medium">Business verification</h2>
          <p className="text-sm text-gray-500">
            Kindly select a business type to fill and upload required business
            documents
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-14 w-full">
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-gray-500" />
                          <SelectValue placeholder="Select business type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {/* <SelectItem value="Unregistered">
                          Unregistered Business
                        </SelectItem> */}
                        <SelectItem value="Registered">
                          Registered Business
                        </SelectItem>
                        <SelectItem value="Incorporated">
                          Incorporated Company
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              Proceed
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
