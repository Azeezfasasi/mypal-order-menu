// Fixed components/forms/MenuItemForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinediningCuisineApi } from "@/services/finedining-cuisine-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FineDiningMenuItem } from "../fine-dinings-offerings/menu-section";
import { FileUploader } from "../shared/FileUploader";

// Define Zod schema for form validation
export const menuItemSchema = z
  .object({
    category_id: z.string().optional(), // Make optional for edits
    name: z.string().min(1, "Menu name is required"),
    description: z.string().optional(),
    minimum_price: z.number().min(0, "Minimum price must be 0 or greater"),
    maximum_price: z.number().min(0, "Maximum price must be 0 or greater"),
    menu_url: z.string().url("Invalid URL format").optional().or(z.literal("")), // Allow empty string or valid URL
  })
  .refine((data) => data.maximum_price > data.minimum_price, {
    message: "Maximum price must be greater than minimum price",
    path: ["maximum_price"],
  });

// Add a refinement to check for file OR url but not both
export const menuItemSchemaWithExclusiveRefinement = menuItemSchema.superRefine(
  (data, ctx) => {
    // Access the file upload status and edit status from context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isFileUploadEmpty = (ctx as any).formContext?.isFileUploadEmpty;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isExistingItem = (ctx as any).formContext?.isExistingItem;

    // If this context isn't available, we can't perform this validation
    if (isFileUploadEmpty === undefined) return;

    // For new items, category_id is required
    if (!isExistingItem && (!data.category_id || data.category_id.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cuisine category is required",
        path: ["category_id"],
      });
    }

    const isUrlProvided = data.menu_url && data.menu_url.trim() !== "";

    // The refinement checks the *final* state before submission.

    // Rule: Either file is not empty OR URL is provided, but NOT both.
    if (isFileUploadEmpty && !isUrlProvided) {
      // Neither file nor URL provided
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either a file (image or PDF) or a menu URL must be provided.",
        path: ["menu_url"], // Associate the error with the menu_url field
      });
    } else if (!isFileUploadEmpty && isUrlProvided) {
      // Both file and URL provided
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Cannot provide both a file and a menu URL. Please choose one.",
        path: ["menu_url"], // Associate the error with the menu_url field
      });
    }
    // Both valid cases:
    // 1. !isFileUploadEmpty && !isUrlProvided (file provided, no URL)
    // 2. isFileUploadEmpty && isUrlProvided (no file, URL provided)
  },
);

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  onSubmit: (data: MenuItemFormValues) => void;
  defaultValues?: MenuItemFormValues; // Keep defaultValues prop as it might contain initial data for new items
  filePreview: string[] | null;
  onFileChange: (files: File[] | null) => void;
  onFilePreviewChange: (previews: string[] | null) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
  fileInputId: string;
  isFileUploadEmpty: boolean;
  currentItem?: FineDiningMenuItem | null;
}

export function MenuItemForm({
  onSubmit,
  defaultValues = {
    category_id: "",
    name: "",
    description: "",
    minimum_price: 0,
    maximum_price: 0,
    menu_url: "",
  },
  filePreview,
  onFileChange,
  onFilePreviewChange,
  isSubmitting = false,
  onCancel,
  submitLabel,
  fileInputId,
  isFileUploadEmpty,
  currentItem, // Receive currentItem prop
}: MenuItemFormProps) {
  const isExistingItem = !!currentItem;

  // Determine the initial value for menu_url based on currentItem type
  // Only populate menu_url if the existing item is of type "URL"
  const initialMenuUrl =
    currentItem?.type === "Url" ? currentItem.menu_url : "";
  const initialDefaultValues = {
    ...defaultValues, // Use provided defaultValues for name and description
    category_id: defaultValues.category_id || "",
    menu_url: initialMenuUrl, // Conditionally set menu_url
    minimum_price: defaultValues.minimum_price || 0,
    maximum_price: defaultValues.maximum_price || 0,
  };

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchemaWithExclusiveRefinement),
    defaultValues: initialDefaultValues, // Use the adjusted default values
    context: { isFileUploadEmpty, isExistingItem }, // Pass context for refinement
  });

  // Fetch user's cuisine categories from the 'my-cuisine' endpoint and normalize to an array
  const { data: myCuisinesData } =
    FinediningCuisineApi.useGetBusinessCuisines();
  const rawMyCuisines = myCuisinesData?.data;
  const categories = Array.isArray(rawMyCuisines)
    ? rawMyCuisines
    : rawMyCuisines && typeof rawMyCuisines === "object"
      ? [rawMyCuisines]
      : [];

  // Watch the menu_url field to control the disabled state of the file uploader
  const menuUrl = form.watch("menu_url");
  const isUrlFieldNotEmpty = menuUrl && menuUrl.trim() !== "";

  // Handle form submission with coordination of file/URL state
  const handleSubmit = (formData: MenuItemFormValues) => {
    // The validation refinement handles the mutual exclusivity check before this point.
    // We just need to pass the relevant data based on which field is populated.
    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 py-4"
      >
        {/* Cuisine category select - only show when creating new item */}
        {!isExistingItem && (
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuisine category</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: { id: string; name: string }) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm mt-1" />
              </FormItem>
            )}
          />
        )}

        {/* New fields for minimum and maximum price (second) */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minimum_price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Minimum Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                    className={
                      fieldState.error
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-sm mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maximum_price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Maximum Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                    className={
                      fieldState.error
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-sm mt-1" />
              </FormItem>
            )}
          />
        </div>

        {/* Menu name (third) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Menu name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter menu name"
                  {...field}
                  className={
                    fieldState.error ? "border-red-500 focus:ring-red-500" : ""
                  }
                />
              </FormControl>
              <FormMessage className="text-red-500 text-sm mt-1" />
            </FormItem>
          )}
        />

        {/* Menu URL Field (fourth) */}
        <FormField
          control={form.control}
          name="menu_url"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Menu URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter menu URL"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    const newValue = e.target.value.trim();
                    // If URL is being entered and a file/preview exists, clear the file state
                    if (newValue !== "" && !isFileUploadEmpty) {
                      onFileChange(null);
                      onFilePreviewChange(null);
                    }
                  }}
                  disabled={!isFileUploadEmpty || isSubmitting} // Disable if file is selected or submitting
                  className={
                    fieldState.error ? "border-red-500 focus:ring-red-500" : ""
                  }
                />
              </FormControl>
              <FormMessage className="text-red-500 text-sm mt-1" />
            </FormItem>
          )}
        />

        {/* File Uploader - last */}
        <FileUploader
          filePreview={filePreview}
          onFileChange={(files) => {
            onFileChange(files);
            // When files are selected, clear URL field if it has a value
            if (files && files.length > 0 && isUrlFieldNotEmpty) {
              form.setValue("menu_url", "");
              form.clearErrors("menu_url");
            }
          }}
          onFilePreviewChange={onFilePreviewChange}
          inputId={fileInputId}
          disabled={isUrlFieldNotEmpty || isSubmitting} // Disable if URL is entered or submitting
          acceptedTypes={["image/*", ".pdf"]}
          multiple={false} // Keep single file mode for menu items
          maxSizeMB={70} // Limit to 70MB
        />

        <DialogFooter className="sm:justify-between flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
