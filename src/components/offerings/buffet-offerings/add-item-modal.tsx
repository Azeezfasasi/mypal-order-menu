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
import { CategoryType } from "@/types/service-offering-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z.number().optional(),
  description: z.string().optional(),
  backgroundImage: z.any().optional(),
});

type AddItemFormData = z.infer<typeof addItemSchema>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryType: string;
}

export default function AddItemModal({
  isOpen,
  onClose,
  categoryId,
  categoryType,
}: AddItemModalProps) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // For buffet meal, require a background image
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>("");

  const { mutate: createItem, isPending } =
    ServiceOfferingApi.useCreateServiceItem();

  const showPricing = categoryType !== CategoryType.BUFFET_MEAL;

  const form = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: "",
      price: undefined,
      description: "",
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, 5 - uploadedImages.length); // Max 5 images

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setUploadedImages((prev) => [...prev, ...newFiles]);
    },
    [uploadedImages.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 5,
    multiple: true,
  });

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: AddItemFormData) => {
    if (!backgroundImage) {
      form.setError("backgroundImage", {
        message: "Background image is required for buffet items.",
      });
      return;
    }
    createItem(
      {
        itemData: {
          name: data.name,
          price: data.price,
          description: data.description,
          category_id: categoryId,
        },
        images: uploadedImages,
        background_image: backgroundImage,
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
    setBackgroundImage(null);
    setBackgroundPreview("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to this subcategory.
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

            {/* Background Image Upload for Buffet Meal */}

            <FormField
              control={form.control}
              name="backgroundImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Background Image <span className="text-red-500">*</span>
                  </FormLabel>
                  {!backgroundImage && (
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div>
              <FormLabel>Images (Optional, Max 5)</FormLabel>
              {uploadedImages.length < 5 && (
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
                    {uploadedImages.length}/5 images uploaded
                  </p>
                </div>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={120}
                        height={80}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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
                {isPending ? "Creating..." : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
