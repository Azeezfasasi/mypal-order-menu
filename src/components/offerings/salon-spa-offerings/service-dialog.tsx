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
import type { IServiceItem } from "@/types/service-offering-types";

// Schema for validating service item form data
const serviceItemSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.coerce.number().min(1, "Price must be at least 1"), // Enforce minimum price of 1
  image: z.any(), // Add image field for service items
});

export type ServiceItemFormValues = z.infer<typeof serviceItemSchema>;

export interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceItemFormValues, image: File | null) => Promise<void>;
  serviceItem?: IServiceItem | null;
  categoryId: string | null;
  categoryName?: string;
  isPending: boolean;
  mode: "add" | "edit";
}

export function ServiceDialog({
  open,
  onOpenChange,
  onSubmit,
  serviceItem,
  categoryId,
  categoryName,
  isPending,
  mode,
}: ServiceDialogProps) {
  // Refs for file inputs
  const serviceImageInputRef = useRef<HTMLInputElement>(null);

  // State for image previews
  const [serviceImagePreview, setServiceImagePreview] = useState<string | null>(
    serviceItem?.image_urls && serviceItem.image_urls.length > 0
      ? serviceItem.image_urls[0]
      : null
  );
  const [selectedServiceImage, setSelectedServiceImage] = useState<File | null>(
    null
  );

  // Form hook for service items
  const form = useForm<ServiceItemFormValues>({
    resolver: zodResolver(serviceItemSchema),
    defaultValues: {
      name: "",
      price: 0,
    },
  });

  // Reset form when serviceItem changes
  useEffect(() => {
    if (open && serviceItem) {
      form.reset({
        name: serviceItem.name,
        price: serviceItem.price || 0,
      });
    }
  }, [serviceItem, open, form]);

  console.log({ categoryId });

  // Handle service image selection
  const handleServiceImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        return;
      }

      setSelectedServiceImage(file);
      const imageUrl = URL.createObjectURL(file);
      setServiceImagePreview(imageUrl);
    }
  };

  // Clear service image
  const clearServiceImage = () => {
    setSelectedServiceImage(null);
    setServiceImagePreview(null);
    if (serviceImageInputRef.current) {
      serviceImageInputRef.current.value = "";
    }
  };

  // Open file dialog for service image
  const triggerServiceImageInput = () => {
    if (serviceImageInputRef.current) {
      serviceImageInputRef.current.click();
    }
  };

  // Update image preview when serviceItem prop changes
  useEffect(() => {
    if (open) {
      setServiceImagePreview(
        serviceItem?.image_urls && serviceItem.image_urls.length > 0
          ? serviceItem.image_urls[0]
          : null
      );
    }
  }, [serviceItem, open]);

  // Reset image preview when dialog closes
  useEffect(() => {
    if (!open) {
      clearServiceImage();
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = async (data: ServiceItemFormValues) => {
    await onSubmit(data, selectedServiceImage);
    handleReset();
  };

  // Reset form and close dialog
  const handleReset = () => {
    form.reset();
    clearServiceImage();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Service" : "Edit service"}
          </DialogTitle>
          {categoryName && (
            <p className="text-sm text-gray-500">
              {mode === "add" ? "Adding to" : "In category"}: {categoryName}
            </p>
          )}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            {/* Service Name Input */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter service name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Price Input */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per person</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="₦0.00"
                      step="0.01"
                      min="1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Image Upload Area - Hidden */}
            <div>
              <Label>Service image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                {serviceImagePreview ? (
                  <div className="relative w-full h-40">
                    <div className="w-full h-full bg-gray-100 rounded overflow-hidden">
                      <Image
                        width={300}
                        height={200}
                        src={serviceImagePreview}
                        alt="Service preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearServiceImage}
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
                      onClick={triggerServiceImageInput}
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
                  ref={serviceImageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleServiceImageChange}
                />
              </div>
            </div>

            {/* Dialog Actions */}
            <DialogFooter className="sm:justify-between gap-4">
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
