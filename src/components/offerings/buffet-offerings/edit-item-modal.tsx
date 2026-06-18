"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { CategoryType, IServiceItem } from "@/types/service-offering-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

const editItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().optional(),
  description: z.string().optional(),
  backgroundImage: z.any().optional(),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: IServiceItem;
  categoryType: CategoryType | null;
}

export default function EditItemModal({
  isOpen,
  onClose,
  item,
  categoryType,
}: EditItemModalProps) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // For buffet meal, require a background image
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>("");
  const [existingBackground, setExistingBackground] = useState<string>("");

  const { mutate: updateItem, isPending } =
    ServiceOfferingApi.useUpdateServiceItem();

  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: "",
      price: undefined,
      description: "",
    },
  });

  // Populate form with existing data when modal opens
  useEffect(() => {
    if (isOpen && item) {
      form.reset({
        name: item.name,
        price: item.price,
        description: item.description || "",
        backgroundImage: undefined,
      });

      // Set existing images
      if (item.image_urls && item.image_urls.length > 0) {
        setExistingImages(item.image_urls);
      } else {
        setExistingImages([]);
      }

      // Set existing background image
      if (item.background_image_url) {
        setExistingBackground(item.background_image_url);
      } else {
        setExistingBackground("");
      }

      // Reset new uploads
      setUploadedImages([]);
      setImagePreviews([]);
      setBackgroundImage(null);
      setBackgroundPreview("");
    }
  }, [isOpen, item, form]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const totalImages = existingImages.length + uploadedImages.length;
      const newFiles = acceptedFiles.slice(0, 5 - totalImages); // Max 5 images total

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setUploadedImages((prev) => [...prev, ...newFiles]);
    },
    [existingImages.length, uploadedImages.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 5,
    multiple: true,
  });

  const removeNewImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic showPricing logic (same as add modal)
  let showPricing = true;
  let isBuffetMeal = false;
  if (categoryType) {
    isBuffetMeal = categoryType === CategoryType.BUFFET_MEAL;
    showPricing = !isBuffetMeal;
  }

  const onSubmit = (data: EditItemFormData) => {
    const categoryId =
      typeof item.category === "string" ? item.category : item.category.id;

    if (isBuffetMeal && !backgroundImage && !existingBackground) {
      form.setError("backgroundImage", {
        message: "Background image is required for buffet items.",
      });
      return;
    }

    updateItem(
      {
        itemId: item.id,
        itemData: {
          name: data.name,
          price: data.price,
          description: data.description,
          category_id: categoryId,
        },
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        ...(isBuffetMeal && backgroundImage
          ? { background_image: backgroundImage }
          : {}),
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    setUploadedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    onClose();
  };

  const totalImages = existingImages.length + uploadedImages.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details of this item.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPricing && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Person (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter item description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Background Image Upload (Required) */}
            <FormField
              control={form.control}
              name="backgroundImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Background Image <span className="text-red-500">*</span>
                  </FormLabel>
                  {!backgroundImage && !existingBackground && (
                    <div
                      className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e: Event) => {
                          const target = e.target as HTMLInputElement;
                          if (target && target.files && target.files[0]) {
                            const file = target.files[0];
                            setBackgroundImage(file);
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              setBackgroundPreview(ev.target?.result as string);
                            reader.readAsDataURL(file);
                            field.onChange(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to select a background image
                      </p>
                    </div>
                  )}
                  {backgroundImage && backgroundPreview && (
                    <div className="mt-2 relative">
                      <Image
                        src={backgroundPreview}
                        alt="Background Preview"
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setBackgroundImage(null);
                          setBackgroundPreview("");
                          field.onChange(undefined);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {existingBackground && !backgroundImage && (
                    <div className="mt-2 relative">
                      <Image
                        src={existingBackground}
                        alt="Current Background"
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setExistingBackground("");
                          field.onChange(undefined);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Current Image
                        </span>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Management */}
            <div>
              <FormLabel>Images (Optional, Max 5)</FormLabel>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {existingImages.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <Image
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          width={120}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeExistingImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              {totalImages < 5 && (
                <div
                  {...getRootProps()}
                  className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? "Drop the images here..."
                      : "Drag & drop images, or click to select"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalImages}/5 images total
                  </p>
                </div>
              )}

              {/* New Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">New Images:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative">
                        <Image
                          src={preview}
                          alt={`New ${index + 1}`}
                          width={120}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isPending ? "Updating..." : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
