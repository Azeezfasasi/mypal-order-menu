// components/forms/ExperienceForm.tsx
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define Zod schema for form validation
export const experienceSchema = z.object({
  experience_name: z.string().min(1, "Please enter an experience name"),
});

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  onSubmit: (data: ExperienceFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialName?: string; // initial value for edit
  existingExperienceIds?: string[]; // kept for compatibility
  existingExperienceNames?: string[]; // names to check for duplicates
}

export function ExperienceForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialName = "",
  existingExperienceIds = [],
  existingExperienceNames = [],
}: ExperienceFormProps) {
  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      experience_name: initialName || "",
    },
  });

  // Prefill when initialName changes (edit mode)
  useEffect(() => {
    form.reset({ experience_name: initialName || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName]);

  // reference existingExperienceIds to avoid unused prop lint
  useEffect(() => {
    if (existingExperienceIds && existingExperienceIds.length > 0) {
      // noop: kept for forward compatibility (could be used for client-side dedupe)
    }
  }, [existingExperienceIds]);

  // Reset form when canceled
  const handleCancelClick = () => {
    form.reset();
    onCancel();
  };

  // Handle form submission
  const handleSubmit = (data: ExperienceFormValues) => {
    onSubmit(data);
  };

  // Watch the input value to detect duplicates
  const currentName = form.watch("experience_name") || "";
  const normalizedCurrent = currentName.trim().toLowerCase();
  const normalizedInitial = (initialName || "").trim().toLowerCase();
  const isDuplicate =
    normalizedCurrent.length > 0 &&
    normalizedCurrent !== normalizedInitial &&
    existingExperienceNames.some(
      (n) => n.trim().toLowerCase() === normalizedCurrent,
    );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 py-4"
      >
        <FormField
          control={form.control}
          name="experience_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter new experience" {...field} />
              </FormControl>
              <FormMessage />
              {isDuplicate && (
                <p className="mt-1 text-xs text-red-600">
                  An experience with this name already exists.
                </p>
              )}
            </FormItem>
          )}
        />

        <DialogFooter className="sm:justify-between flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            disabled={isLoading || isDuplicate}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
