"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { PromotionsApi, type PromotionType } from "@/services/api/promotions-api";

// Form validation schema
const promoteItemSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .refine(
      (value) => {
        const words = value.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length <= 50;
      },
      { message: "Title cannot exceed 50 words" }
    ),
  duration_hours: z.string().min(1, { message: "Duration is required" }),
});

type PromoteItemFormData = z.infer<typeof promoteItemSchema>;

// Helper function to count words
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

interface PromoteItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  promotionType: PromotionType;
}

const DURATION_OPTIONS = [
  { value: "24", label: "1 day", hours: 24 },
  { value: "72", label: "3 days", hours: 72 },
  { value: "168", label: "1 week", hours: 168 },
  { value: "720", label: "1 month", hours: 720 },
  { value: "1440", label: "2 months", hours: 1440 },
  { value: "2160", label: "3 months", hours: 2160 },
];

export default function PromoteItemModal({
  isOpen,
  onClose,
  itemId,
  promotionType,
}: PromoteItemModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const form = useForm<PromoteItemFormData>({
    resolver: zodResolver(promoteItemSchema),
    defaultValues: {
      title: "",
      duration_hours: "168", // Default to 1 week
    },
  });

  const createPromotion = PromotionsApi.useCreatePromotion();
  const titleValue = form.watch("title");
  const wordCount = countWords(titleValue);
  const remainingWords = 50 - wordCount;

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("File size must be less than 5MB");
        return;
      }

      setUploadedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file deletion
  const handleDeleteFile = () => {
    setUploadedFile(null);
    setUploadedImagePreview(null);
  };

  const handleClose = () => {
    // Reset uploaded file when closing
    setUploadedFile(null);
    setUploadedImagePreview(null);
    form.reset();
    onClose();
  };

  const onSubmit = async (data: PromoteItemFormData) => {
    try {
      const selectedDuration = DURATION_OPTIONS.find(
        (opt) => opt.value === data.duration_hours
      );

      if (!selectedDuration) {
        return;
      }

      // Build request payload
      const promotionPayload: {
        promotion_type: PromotionType;
        title: string;
        duration_hours: number;
        service_item_id?: string;
        service_category_id?: string;
        accommodation_id?: string;
        fine_dining_menu_id?: string;
        image?: File;
      } = {
        promotion_type: promotionType,
        title: data.title,
        duration_hours: selectedDuration.hours,
      };
      
      // Add the appropriate ID field based on promotion type
      if (promotionType === "service_item") {
        promotionPayload.service_item_id = itemId;
      } else if (promotionType === "service_category") {
        promotionPayload.service_category_id = itemId;
      } else if (promotionType === "accommodation") {
        promotionPayload.accommodation_id = itemId;
      } else if (promotionType === "fine_dining_menu") {
        promotionPayload.fine_dining_menu_id = itemId;
      }

      // Add image if uploaded
      if (uploadedFile) {
        promotionPayload.image = uploadedFile;
      }

      console.log("Creating promotion with itemId:", itemId, "promotionType:", promotionType);

      await createPromotion.mutateAsync(promotionPayload);

      // Close modal and reset form on success
      handleClose();
    } catch (error) {
      console.error("Error submitting promotion:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md md:w-[95%] p-0 gap-0 rounded-xl border-0 px-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between py-5 border-gray-200">
          <DialogTitle className="text-base font-semibold">Promote</DialogTitle>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 bg-gray-100 rounded-[8px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Title
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Try Granis its very awesome"
                          {...field}
                          disabled={createPromotion.isPending}
                          className="border-gray-300 text-sm pr-16"
                          onKeyDown={(e) => {
                            // Prevent typing if word limit reached and user is adding a new word
                            if (wordCount >= 50 && e.key === " ") {
                              e.preventDefault();
                            }
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          Max {remainingWords}
                        </span>
                      </div>
                    </FormControl>
                    <FormLabel className="flex justify-end text-sm font-medium text-gray-900">
                      <span className="text-xs text-gray-500">
                        Max 50 words
                      </span>
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Duration Field */}
              <FormField
                control={form.control}
                name="duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Duration
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="border-gray-300 text-sm">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Image Preview & Upload Section */}
              <div className="mt-4">
                {uploadedImagePreview ? (
                  // Show uploaded image on left and success message on right
                  <div className="flex md:flex-col gap-4 h-40">
                    {/* Uploaded Image */}
                    <div className="relative w-[35%] md:w-full md:h-full bg-white rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={uploadedImagePreview}
                        alt="Uploaded preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Success Message */}
                    <div className="flex-1 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        {/* <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" /> */}
                        <Image src="/images/fileupload.svg" alt="Upload" width={48} height={48} className="text-gray-400" />
                        <div className="text-sm w-full">
                          <p className="font-medium text-[14px] leading-[154%] text-[#1D2739]">
                            Upload Successful
                          </p>
                          <p className="text-[8px] font-[400] leading-[145%] text-gray-600 mt-1 text-wrap">
                            {uploadedFile?.name} • {(uploadedFile?.size || 0) / 1024 < 1000 ? `${((uploadedFile?.size || 0) / 1024).toFixed(0)} KB` : `${((uploadedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteFile}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Delete image"
                      >
                        {/* <Trash2 className="w-5 h-5" /> */}
                        <Image src="/images/bin.svg" alt="Upload" width={20} height={20} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Show upload area
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                    <label className="flex flex-col items-center justify-center gap-2 p-4 h-40 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={createPromotion.isPending}
                      />
                      <Upload className="w-6 h-6 text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Upload Image
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createPromotion.isPending}
                  className="flex-1 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPromotion.isPending}
                  className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                >
                  {createPromotion.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {createPromotion.isPending ? "Creating..." : "Promote"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

