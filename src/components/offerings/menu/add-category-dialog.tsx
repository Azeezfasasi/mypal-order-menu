"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CategoryType, ServiceType } from "@/types/service-offering-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  serviceType: z.nativeEnum(ServiceType),
  category_type: z.nativeEnum(CategoryType).optional(),
  price_per_child: z.number().min(0).optional(),
  price_per_adults: z.number().min(0).optional(),
  parentCategory: z.string().optional(),
  hasSubcategories: z.boolean().default(false),
  image: z
    .any()
    .optional()
    .refine(
      (file) => {
        return file === undefined || file instanceof File;
      },
      {
        message: "Image must be a file",
      }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCategoryDialogProps {
  parentId?: string | null;
  parentCategoryName?: string;
  onAddCategory: (values: FormData) => void;
  buttonText?: string;
  triggerButtonVariant?:
    | "default"
    | "link"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  triggerButtonClassName?: string;
  triggerButtonSize?: "default" | "sm" | "lg" | "icon" | null | undefined;
  icon?: React.ReactNode;
  level?: number; // Add level prop
  showTriggerButton?: boolean;
}

export function AddCategoryDialog({
  parentId,
  parentCategoryName,
  onAddCategory,
  buttonText = "Add new category",
  triggerButtonVariant = "default",
  triggerButtonClassName = "bg-primary-600 text-white",
  triggerButtonSize = "sm",
  icon,
  level = 0, // Default to 0 if not provided
  showTriggerButton = true, // Default to true to show the button
}: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dropzoneOnChange, setDropzoneOnChange] = useState<
    ((file: File) => void) | null
  >(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      serviceType: ServiceType.MAINSTREAM,
      hasSubcategories: false,
      parentCategory: parentId as string | undefined,
      image: undefined,
    },
  });

  const serviceType = form.watch("serviceType");
  const isBuffet = serviceType === ServiceType.BUFFET;

  // react-dropzone for image upload
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && dropzoneOnChange) {
        // Always pass the File object, not a path
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

  const onSubmit = (values: FormValues) => {
    // Always send FormData for backend upload
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("serviceType", values.serviceType);
    if (values.category_type) {
      formData.append("category_type", values.category_type);
    }
    if (values.price_per_child !== undefined) {
      formData.append("price_per_child", String(values.price_per_child));
    }
    if (values.price_per_adults !== undefined) {
      formData.append("price_per_adults", String(values.price_per_adults));
    }
    if (values.parentCategory) {
      formData.append("parentCategory", values.parentCategory);
    }
    formData.append(
      "hasSubcategories",
      values.hasSubcategories ? "true" : "false"
    );
    if (values.image && values.image instanceof File) {
      formData.append("image", values.image);
    }
    onAddCategory(formData);
    form.reset();
    setImagePreview(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {showTriggerButton && (
          <Button
            variant={triggerButtonVariant}
            size={triggerButtonSize}
            className={triggerButtonClassName}
            // disabled={level === 2} // Disable button if at last allowed subcategory level
          >
            {icon}
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            {parentId && parentCategoryName
              ? `Add a new subcategory to: "${parentCategoryName}". Enter its details below.`
              : "Create a new top-level category. Enter its details below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Breakfast Menu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload (Required) */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => {
                if (dropzoneOnChange !== field.onChange) {
                  setDropzoneOnChange(() => field.onChange);
                }
                return (
                  <FormItem>
                    <FormLabel>Category Image</FormLabel>
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

            {/* <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ServiceType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {isBuffet && (
              <>
                <FormField
                  control={form.control}
                  name="category_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CategoryType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_child"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Child (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_adults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Adult (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="hasSubcategories"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Allow Subcategories
                    </FormLabel>
                    <FormDescription>
                      Enable this to create nested categories
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={level === 2 ? false : field.value}
                      onCheckedChange={level === 2 ? undefined : field.onChange}
                      disabled={level === 2}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Add Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
