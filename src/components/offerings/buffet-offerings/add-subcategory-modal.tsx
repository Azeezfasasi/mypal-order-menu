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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceOfferingApi } from "@/services/api/business-service-menu-offerings";
import { CategoryType, ServiceType } from "@/types/service-offering-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addSubcategorySchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  pricePerAdult: z.number().optional(),
  pricePerChild: z.number().optional(),
  image: z.any().refine((file) => file instanceof File, {
    message: "Image is required",
  }),
  // Optional metadata fields for buffet meals
  mainCatch: z.string().optional(),
  mainCatchDescription: z.string().optional(),
  catchyPhrase: z.string().optional(),
  likeable: z.boolean().default(false),
  shareable: z.boolean().default(false),
  gatePass: z.boolean().optional(),
  is18Plus: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  newTag: z.string().optional(),
});

type AddSubcategoryFormData = z.infer<typeof addSubcategorySchema>;

interface AddSubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentCategoryId: string;
  categoryType: CategoryType;
}

export default function AddSubcategoryModal({
  isOpen,
  onClose,
  parentCategoryId,
  categoryType,
}: AddSubcategoryModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Only use the mutation for FormData

  const { mutate: createCategoryWithImage, isPending: isPendingWithImage } =
    ServiceOfferingApi.useCreateCategoryWithImage();

  const form = useForm<AddSubcategoryFormData>({
    resolver: zodResolver(addSubcategorySchema),
    defaultValues: {
      name: "",
      pricePerAdult: undefined,
      pricePerChild: undefined,
      image: undefined,
      mainCatch: "",
      mainCatchDescription: "",
      catchyPhrase: "",
      likeable: false,
      shareable: false,
      gatePass: false,
      is18Plus: false,
      tags: [],
      newTag: "",
    },
  });

  const showPricing = categoryType === CategoryType.BUFFET_MEAL;

  // react-dropzone for image upload, using react-hook-form's field.onChange
  const [dropzoneOnChange, setDropzoneOnChange] = useState<
    ((file: File) => void) | null
  >(null);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && dropzoneOnChange) {
        dropzoneOnChange(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [dropzoneOnChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif"] },
    maxFiles: 1,
  });

  const removeImage = (onChange: (file: undefined) => void) => {
    setImagePreview(null);
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

    // Add optional metadata fields for buffet meals
    if (data.mainCatch) {
      formData.append("main_catch", data.mainCatch);
    }
    if (data.mainCatchDescription) {
      formData.append("main_catch_description", data.mainCatchDescription);
    }
    if (data.catchyPhrase) {
      formData.append("catchy_phrase", data.catchyPhrase);
    }
    if (data.gatePass) {
      formData.append("gate_pass", data.gatePass.toString());
    }
    if (data.is18Plus) {
      formData.append("is_18_plus", data.is18Plus.toString());
    }
    if (data.likeable) {
      formData.append("likeable", data.likeable.toString());
    }
    if (data.shareable) {
      formData.append("shareable", data.shareable.toString());
    }
    if (data.tags && data.tags.length > 0) {
      formData.append("tags", JSON.stringify(data.tags));
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl md:max-w-[90%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Subcategory</DialogTitle>
          <DialogDescription>
            Create a new subcategory for this menu section.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* IDENTITY SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Identity
              </h3>

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
            </section>

            {/* PRICING SECTION */}
            {showPricing && (
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Pricing
                </h3>

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
              </section>
            )}

            {/* MAIN CATCH SECTION */}
            {showPricing && (
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Main Catch
                </h3>

                <FormField
                  control={form.control}
                  name="mainCatch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="drinks">Drinks</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mainCatchDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Catch Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Unlimited food, buffet brunch e.t.c."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            )}

            {/* ENTRY & ACCESS SECTION */}
            {showPricing && (
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Entry & Access
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gatePass"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel>Entry Fee Required</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is18Plus"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel>18+ Only</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            )}

            {/* ENGAGEMENT SECTION */}
            {showPricing && (
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Engagement
                </h3>

                <FormField
                  control={form.control}
                  name="catchyPhrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catchy Phrase</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g come for the cocktail, stay for the vibe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="likeable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel>Likeable</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shareable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <FormLabel>Shareable</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            )}

            {/* TAGS SECTION */}
            {showPricing && (
              <section className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">
                  Tags
                </h3>

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="newTag"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Add a tag..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newTag = form.getValues("newTag");
                      if (newTag?.trim()) {
                        const currentTags = form.getValues("tags") || [];
                        if (!currentTags.includes(newTag)) {
                          form.setValue("tags", [...currentTags, newTag]);
                          form.setValue("newTag", "");
                        }
                      }
                    }}
                    className="px-4"
                  >
                    Add
                  </Button>
                </div>

                {(form.watch("tags") || [])?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(form.watch("tags") || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          form.setValue(
                            "tags",
                            (form.getValues("tags") || []).filter((t) => t !== tag)
                          );
                        }}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* UPLOAD IMAGE SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Upload Image
              </h3>

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => {
                  // Set the dropzone's onChange handler to the field's onChange
                  if (dropzoneOnChange !== field.onChange) {
                    setDropzoneOnChange(() => field.onChange);
                  }
                  return (
                    <FormItem>
                      <FormLabel>
                        Background Image <span className="text-red-500">*</span>
                      </FormLabel>
                      {!imagePreview ? (
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
                            Drag & drop an image, or click to select
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
                  );
                }}
              />
            </section>

            {/* ACTION BUTTONS */}
            <DialogFooter className="gap-3">
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
