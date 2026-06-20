"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { BusinessApi } from "@/services/api/business-api";
import { BUSINESS_QUERY_KEYS } from "@/services/query-keys";
import { BusinessCategoryType } from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Define constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Form schema with validations
const profileFormSchema = z.object({
  business_name: z
    .string()
    .min(2, "Company name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 characters"),
  business_category: z.string().optional(),
  business_type: z.string().optional(),
  description: z.string().min(20, "Description must be at least 20 characters"),
  business_bank_name: z.string().optional(),
  business_acc_name: z.string().optional(),
  business_acc_number: z.string().optional(),
  profile_image: z
    .custom<FileList | null | undefined>(
      (val) => val instanceof FileList || val === null || val === undefined,
      "Expected a FileList",
    )
    .optional()
    .refine((files) => !files || files.length <= 1, "Only one image allowed")
    .refine(
      // Treat empty FileList as no file. Only validate size when a file exists.
      (files) =>
        !files ||
        files.length === 0 ||
        (files[0] instanceof File && files[0].size <= MAX_FILE_SIZE),
      `Max file size is 5MB`,
    )
    .refine(
      // Only validate mime type when a file is present
      (files) =>
        !files ||
        files.length === 0 ||
        (files[0] instanceof File &&
          ACCEPTED_IMAGE_TYPES.includes(files[0].type)),
      "Only .jpg, .jpeg, .png and .webp formats are supported.",
    ),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export interface IBusinessProfileUpdatePayload {
  business_name?: string;
  phone_number?: string;
  description?: string;
  image?: File;
  address?: string;
  business_type?: string;
}

export default function BusinessProfileTab() {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // API hooks
  const {
    data: businessData,
    isLoading: isLoadingBusiness,
    refetch: refetchBusiness,
  } = BusinessApi.useGetCurrentBusiness();

  const { mutate: updateProfile, isPending: isUpdating } =
    BusinessAuthApi.useUpdateBusiness();

  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      business_name: "",
      address: "",
      email: "",
      phone_number: "",
      business_category: "",
      business_type: "",
      description: "",
      business_bank_name: "",
      business_acc_name: "",
      business_acc_number: "",
      profile_image: undefined,
    },
  });

  // Watch for file uploads to preview images
  const watchedImageFile = form.watch("profile_image");

  // Load business data into form
  useEffect(() => {
    if (businessData?.data) {
      const business = businessData.data;

      // Reset form with business data
      form.reset(
        {
          business_name: business.business_name || "",
          address: business.address || "",
          email: business.email || "",
          phone_number: business.phone_number || "",
          business_category:
            business.category?.business_type || business.category?.id || "",
          business_type: business.business_type || "",
          description: business.description || "",
          business_bank_name: business.business_bank_name || "",
          business_acc_name: business.business_acc_name || "",
          business_acc_number: business.business_acc_number || "",
        },
        {
          keepValues: false, // Make sure to replace all values
          keepDirty: false, // Reset the dirty state
        },
      );

      // Set original image URL for display
      setOriginalImageUrl(business.image_url || null);
    }
  }, [businessData, form]);

  // Handle image preview
  useEffect(() => {
    let objectUrl: string | null = null;

    if (
      watchedImageFile &&
      watchedImageFile.length > 0 &&
      watchedImageFile[0] instanceof File
    ) {
      objectUrl = URL.createObjectURL(watchedImageFile[0]);
      setImagePreviewUrl(objectUrl);
    } else {
      setImagePreviewUrl(originalImageUrl);
    }

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [watchedImageFile, originalImageUrl]);

  // Form submission handler
  const onSubmit = (values: ProfileFormValues) => {
    const payload: IBusinessProfileUpdatePayload = {
      business_name: values.business_name,
      description: values.description,
      address: values.address,
      phone_number: values.phone_number,
      business_type: values.business_type,
      image: values.profile_image?.[0],
    };

    console.log({ payload });

    updateProfile(payload, {
      onSuccess: (data) => {
        toast.success("Profile updated successfully!");
        setEditMode(false);
        
        // Invalidate the business query cache to force a fresh fetch
        queryClient.invalidateQueries({
          queryKey: BUSINESS_QUERY_KEYS.current(),
        });
        
        refetchBusiness();

        if (data.data?.business?.image_url) {
          setOriginalImageUrl(data.data.business.image_url);
        }
        form.resetField("profile_image");
      },
      onError: (error) => {
        toast.error(error?.message || "Failed to update profile.");
        form.resetField("profile_image");
      },
    });
  };

  // Toggle edit mode
  // const toggleEditMode = () => {
  //   if (editMode) {
  //     // Reset form to original values when canceling edit
  //     if (businessData?.data) {
  //       const business = businessData.data;
  //       form.reset(
  //         {
  //           business_name: business.business_name || "",
  //           address: business.address || "",
  //           email: business.email || "",
  //           phone_number: business.business_number || "",
  //           business_category:
  //             business.category?.business_type || business.category?.id || "",
  //           business_type: business.business_type || "",
  //           description: business.description || "",
  //           business_bank_name: business.business_bank_name || "",
  //           business_acc_name: business.business_acc_name || "",
  //           business_acc_number: business.business_acc_number || "",
  //           profile_image: undefined,
  //         },
  //         {
  //           keepDirty: false,
  //           keepErrors: false,
  //         },
  //       );
  //     }
  //   }
  //   setEditMode(!editMode);
  // };

  // Trigger file input click
  const triggerFileInput = () => {
    document.getElementById("profile_image_input")?.click();
  };

  // Debug form state if needed
  useEffect(() => {
    console.log("Form dirty state updated:", {
      isDirty: form.formState.isDirty,
      dirtyFields: form.formState.dirtyFields,
    });
  }, [form.formState.isDirty, form.formState.dirtyFields]);

  return (
    <>
      {/* Header section with Edit/Save/Cancel Buttons */}
      <div className="flex justify-between items-center mb-6 md:flex-col md:items-start md:gap-4">
        <h2 className="text-xl md:text-lg font-semibold text-primary-500 font-sora">
          Company Profile
        </h2>
        {/* <div className="flex gap-2 md:w-full md:flex-col">
          {editMode ? (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={toggleEditMode}
                disabled={isUpdating}
              >
                <XIcon className="h-4 w-4" /> Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // Trigger form submission programmatically
                  const formElement = document.getElementById("profile-form");
                  if (formElement) {
                    formElement.dispatchEvent(
                      new Event("submit", { bubbles: true, cancelable: true }),
                    );
                  }
                }}
                className="bg-primary hover:bg-primary/90 flex items-center gap-1 disabled:bg-gray-500"
                disabled={isUpdating || !form.formState.isDirty}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90 flex items-center gap-1"
              onClick={toggleEditMode}
              disabled={isLoadingBusiness}
            >
              {isLoadingBusiness ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" /> Edit Profile
                </>
              )}
            </Button>
          )}
        </div> */}
      </div>

      {/* Profile Form */}
      <Form {...form}>
        <form
          id="profile-form"
          className="space-y-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Profile Image Section */}
          <FormItem className="mb-8">
            <FormLabel>Profile Image</FormLabel>
            <div className="mt-2 flex items-center gap-4 md:flex-col md:items-start">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {isUpdating && form.formState.dirtyFields.profile_image ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : imagePreviewUrl ? (
                  <Image
                    src={imagePreviewUrl}
                    alt="Profile Preview"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    key={imagePreviewUrl}
                    onError={() => {
                      setImagePreviewUrl("/placeholder.svg?text=Err");
                      setOriginalImageUrl("/placeholder.svg?text=Err");
                    }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No Image
                  </span>
                )}
              </div>

              {editMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  disabled={isUpdating}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" /> Upload Image
                </Button>
              )}
            </div>

            <FormControl className="sr-only">
              <Input
                id="profile_image_input"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                {...form.register("profile_image")}
                className="hidden"
                disabled={!editMode || isUpdating}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          {/* Company Information Section */}
          <h3 className="text-lg md:text-base font-medium text-primary-500 font-sora border-b pb-2 mb-4">
            Company Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-6 mb-8">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!editMode || isLoadingBusiness || isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!editMode || isLoadingBusiness || isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company email address</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company phone number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!editMode || isLoadingBusiness || isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Category</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => field.onChange(val)}
                      value={field.value}
                    >
                      <SelectTrigger
                        aria-label="Business Type"
                        disabled={!editMode || isLoadingBusiness || isUpdating}
                      >
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BusinessCategoryType).map((bt) => (
                          <SelectItem key={String(bt)} value={String(bt)}>
                            {String(bt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bank Details Section */}
          <h3 className="text-lg md:text-base font-medium text-primary-500 font-sora border-b pb-2 mb-4">
            Bank Details (View Only)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These details are managed in the &apos;Settlement Accounts&apos;
            tab.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-6 mb-8">
            <FormField
              control={form.control}
              name="business_bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} placeholder="N/A" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="business_acc_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={true} placeholder="N/A" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="business_acc_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      disabled={true}
                      placeholder="N/A"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Description Section */}
          <h3 className="text-md md:text-sm font-medium text-primary-500 font-sora border-b pb-2 mb-4">
            Company Description
          </h3>
          <div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      {...field}
                      disabled={!editMode || isLoadingBusiness || isUpdating}
                      placeholder="Tell customers about your business..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </>
  );
}
