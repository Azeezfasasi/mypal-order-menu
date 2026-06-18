"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IServiceCategory } from "@/types/service-offering-types";

// Schema for validating category form data
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  image: z.any().optional(), // Image is optional
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormValues, image: File | null) => Promise<void>;
  category?: IServiceCategory | null;
  isPending: boolean;
  mode: "add" | "edit";
}

export function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
  isPending,
  mode,
}: CategoryDialogProps) {
  // Refs for file inputs
  const categoryImageInputRef = useRef<HTMLInputElement>(null);

  // State for image previews
  const [categoryImagePreview, setCategoryImagePreview] = useState<
    string | null
  >(
    category?.image_urls && category.image_urls.length > 0
      ? category.image_urls[0]
      : null
  );
  const [selectedCategoryImage, setSelectedCategoryImage] =
    useState<File | null>(null);

  // Form hook for category
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  // Reset form when category changes in edit mode
  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name,
      });
      setCategoryImagePreview(
        category.image_urls && category.image_urls.length > 0
          ? category.image_urls[0]
          : null
      );
    }
  }, [category, open, form]);

  // Handle category image selection
  const handleCategoryImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        return;
      }

      setSelectedCategoryImage(file);
      const imageUrl = URL.createObjectURL(file);
      setCategoryImagePreview(imageUrl);
    }
  };

  // Clear category image
  const clearCategoryImage = () => {
    setSelectedCategoryImage(null);
    setCategoryImagePreview(null);
    if (categoryImageInputRef.current) {
      categoryImageInputRef.current.value = "";
    }
  };

  // Open file dialog for category image
  const triggerCategoryImageInput = () => {
    if (categoryImageInputRef.current) {
      categoryImageInputRef.current.click();
    }
  };

  // Update image preview when category prop changes
  useEffect(() => {
    if (open) {
      setCategoryImagePreview(
        category?.image_urls && category.image_urls.length > 0
          ? category.image_urls[0]
          : null
      );
    }
  }, [category, open]);

  // Reset image preview when dialog closes
  useEffect(() => {
    if (!open) {
      clearCategoryImage();
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = async (data: CategoryFormValues) => {
    await onSubmit(data, selectedCategoryImage);
    handleReset();
  };

  // Reset form and close dialog
  const handleReset = () => {
    form.reset();
    clearCategoryImage();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add category" : "Edit category"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            {/* Category Name Input */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Image Upload Area - Hidden */}
            <div className="hidden">
              <Label>Category image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                {categoryImagePreview ? (
                  <div className="relative w-full h-40">
                    <div className="w-full h-full bg-gray-100 rounded overflow-hidden">
                      <Image
                        width={300}
                        height={200}
                        src={categoryImagePreview}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearCategoryImage}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerCategoryImageInput}
                      className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 mb-2"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                    <p className="text-sm text-gray-600">
                      Click to upload an image or drag and drop an image here
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Maximum file size should not exceed 2mb
                    </p>
                  </div>
                )}
                <input
                  ref={categoryImageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCategoryImageChange}
                />
              </div>
            </div>

            {/* Dialog Actions */}
            <DialogFooter className="sm:justify-between gap-4 space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "add" ? "Saving..." : "Updating..."}
                  </>
                ) : mode === "add" ? (
                  "Save"
                ) : (
                  "Update"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
