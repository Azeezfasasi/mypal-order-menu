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
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { CategoryType, ServiceType } from "@/types/service-offering-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addSubcategorySchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  pricePerAdult: z.number().optional(),
  pricePerChild: z.number().optional(),
  image: z.any().refine((file) => file instanceof File, {
    message: "Image is required",
  }),
});

type AddSubcategoryFormData = z.infer<typeof addSubcategorySchema>;

interface AddSubcategoryModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  parentCategoryId: string;
  categoryType: CategoryType;
}

export default function AddSubcategoryModalSimple({
  isOpen,
  onClose,
  parentCategoryId,
  categoryType,
}: AddSubcategoryModalSimpleProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createCategoryWithImage, isPending: isPendingWithImage } =
    ServiceOfferingApi.useCreateCategoryWithImage();

  const form = useForm<AddSubcategoryFormData>({
    resolver: zodResolver(addSubcategorySchema),
    defaultValues: {
      name: "",
      pricePerAdult: undefined,
      pricePerChild: undefined,
      image: undefined,
    },
  });

  const showPricing = categoryType === CategoryType.BUFFET_MEAL;

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (onChange: (file: undefined) => void) => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange(undefined);
  };

  const onSubmit = (data: AddSubcategoryFormData) => {
    // Always require image, enforced by schema
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("serviceType", ServiceType.BUFFET);
    formData.append("parentCategory", parentCategoryId);
    formData.append("category_type", categoryType);

    if (data.pricePerAdult !== undefined) {
      formData.append("price_per_adults", data.pricePerAdult.toString());
    }
    if (data.pricePerChild !== undefined) {
      formData.append("price_per_child", data.pricePerChild.toString());
    }

    formData.append("image", data.image);

    createCategoryWithImage(formData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    form.reset();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Subcategory</DialogTitle>
          <DialogDescription>
            Create a new subcategory for this menu section.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subcategory name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPricing && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pricePerAdult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Adult</FormLabel>
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

                <FormField
                  control={form.control}
                  name="pricePerChild"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Child</FormLabel>
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
              </div>
            )}

            {/* Image Upload (Required) */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Background Image <span className="text-red-500">*</span>
                  </FormLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, field.onChange)}
                    className="hidden"
                  />
                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to select an image
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(field.onChange)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPendingWithImage}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isPendingWithImage ? "Creating..." : "Create Subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
