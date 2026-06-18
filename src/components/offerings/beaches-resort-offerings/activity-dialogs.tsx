import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  IActivityPrice,
  IBusinessActivity,
  IUpdateActivityDto,
} from "@/services/api/business-activity-offering-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Zod Schema
const activitySchema = z.object({
  name: z
    .string()
    .min(1, "Activity name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  images: z.array(z.instanceof(File)).min(1, "At least one image is required"),
  activityprices: z
    .array(
      z.object({
        price: z.string().min(1, "Price is required"),
        time: z.string().min(1, "Duration is required"),
      }),
    )
    .min(1, "At least one price is required"),
});

// Function to create conditional schema based on existing images
const createActivitySchema = (hasExistingImages: boolean = false) => {
  return z.object({
    name: z
      .string()
      .min(1, "Activity name is required")
      .max(100, "Name must be less than 100 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description must be less than 500 characters"),
    images: hasExistingImages
      ? z.array(z.instanceof(File)).optional().default([]) // Optional if existing images
      : z.array(z.instanceof(File)).min(1, "At least one image is required"), // Required if no existing images
    activityprices: z
      .array(
        z.object({
          price: z.string().min(1, "Price is required"),
          time: z.string().min(1, "Duration is required"),
        }),
      )
      .min(1, "At least one price is required"),
  });
};

const priceSchema = z.object({
  price: z.string().min(1, "Price is required"),
  time: z.string().min(1, "Duration is required"),
});

type ActivityFormData = z.infer<typeof activitySchema>;
type PriceFormData = z.infer<typeof priceSchema>;

// Types
interface AddActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActivityFormData) => void;
  isLoading?: boolean;
}

interface EditActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: IBusinessActivity | null;
  onSubmit: (data: ActivityFormData | IUpdateActivityDto) => void;
  isLoading?: boolean;
}

interface ViewActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity: IBusinessActivity | null;
}

interface PriceModalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity: IBusinessActivity | null;
}

interface ImageModalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity: IBusinessActivity | null;
  onDeleteImage: (imageId: string) => void;
}

// Shared Form Components
const ImageUploadSection: React.FC<{
  value: File[];
  onChange: (files: File[]) => void;
  title?: string;
  existingImages?: Array<{ id: string; image_url: string }>;
}> = ({ value = [], onChange, title = "Images", existingImages = [] }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      onChange([...value, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Label>{title}</Label>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Images
        </Button>

        {/* Show existing images */}
        {existingImages.length > 0 && (
          <div>
            <Label className="text-sm text-gray-600">Current Images</Label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {existingImages.map((image, index) => (
                <div key={image.id} className="relative">
                  <Image
                    src={image.image_url}
                    alt={`Current ${index + 1}`}
                    className="w-full h-20 object-cover rounded border-2 border-blue-200"
                    width={300}
                    height={100}
                  />
                  <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                    Current
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show new images */}
        {value.length > 0 && (
          <div>
            <Label className="text-sm text-gray-600">
              New Images to Upload
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {value.map((file, index) => (
                <div key={index} className="relative">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded border-2 border-green-200"
                    width={300}
                    height={100}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 rounded">
                    New
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PricingSection: React.FC<{
  value: IActivityPrice[];
  onChange: (prices: IActivityPrice[]) => void;
}> = ({ value = [], onChange }) => {
  const priceForm = useForm<PriceFormData>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      price: "",
      time: "",
    },
  });

  const addPrice = (data: PriceFormData) => {
    onChange([...value, data]);
    priceForm.reset();
  };

  const removePrice = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Label>Pricing</Label>
      <div className="space-y-2">
        <Form {...priceForm}>
          <div className="flex gap-2">
            <FormField
              control={priceForm.control}
              name="price"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Price (e.g., #50)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={priceForm.control}
              name="time"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Duration (e.g., 2 hours)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              size="sm"
              onClick={priceForm.handleSubmit(addPrice)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Form>

        {value.map((price, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 p-2 rounded"
          >
            <span>
              {price.price} - {price.time}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removePrice(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add Activity Dialog
export const AddActivityDialog: React.FC<AddActivityDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      activityprices: [],
    },
  });

  const handleSubmit = (data: ActivityFormData) => {
    onSubmit(data);
    form.reset();
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-white text-cyan-600 hover:bg-cyan-50 font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          Add activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Activity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter activity description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <ImageUploadSection
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityprices"
              render={({ field }) => (
                <FormItem>
                  <PricingSection
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Activity"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Activity Dialog
export const EditActivityDialog: React.FC<EditActivityDialogProps> = ({
  isOpen,
  onOpenChange,
  activity,
  onSubmit,
  isLoading = false,
}) => {
  // Check if there are existing images
  const hasExistingImages = activity?.images && activity.images.length > 0;

  // Use conditional schema based on existing images
  const schema = createActivitySchema(hasExistingImages);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      activityprices: [],
    },
  });

  // Populate form when activity changes
  useEffect(() => {
    if (activity && isOpen) {
      form.reset({
        name: activity.name || "",
        description: activity.description || "",
        images: [],
        activityprices: activity.prices || [],
      });
    }
  }, [activity, isOpen, form]);

  const handleSubmit = (data: ActivityFormData) => {
    // Combine existing images (as objects) with new images (as Files)
    const existingImageObjects = activity?.images || [];
    const newImageFiles = data.images || [];

    const payload = {
      ...data,
      images: [...existingImageObjects, ...newImageFiles], // Combine existing + new
    };
    onSubmit(payload);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter activity description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <ImageUploadSection
                    value={field.value || []}
                    onChange={field.onChange}
                    title="Add New Images"
                    existingImages={activity?.images || []}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityprices"
              render={({ field }) => (
                <FormItem>
                  <PricingSection
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Updating..." : "Update Activity"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// View Activity Dialog
export const ViewActivityDialog: React.FC<ViewActivityDialogProps> = ({
  isOpen,
  onOpenChange,
  activity,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{activity?.name}</DialogTitle>
        </DialogHeader>
        {activity && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{activity.description}</p>
            </div>

            {activity.images && activity.images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {activity.images.map((image, index) => (
                    <Image
                      key={image.id || index}
                      src={image.image_url}
                      alt={`${activity.name} ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                      width={300}
                      height={150}
                    />
                  ))}
                </div>
              </div>
            )}

            {activity.prices && activity.prices.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Pricing</h3>
                <div className="space-y-2">
                  {activity.prices.map((price, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span className="font-medium">{price.price}</span>
                      <span className="text-gray-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {price.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Price Modal Dialog
export const PriceModalDialog: React.FC<PriceModalDialogProps> = ({
  isOpen,
  onOpenChange,
  activity,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activity?.name} - Pricing</DialogTitle>
        </DialogHeader>
        {activity?.prices && activity.prices.length > 0 ? (
          <div className="space-y-2">
            {activity.prices.map((price, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <span className="font-medium text-lg">{price.price}</span>
                <span className="text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {price.time}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pricing information available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Image Modal Dialog
export const ImageModalDialog: React.FC<ImageModalDialogProps> = ({
  isOpen,
  onOpenChange,
  activity,
  onDeleteImage,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{activity?.name} - Images</DialogTitle>
        </DialogHeader>
        {activity?.images && activity.images.length > 0 ? (
          <div className="grid md:grid-cols-1 grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {activity.images.map((image, index) => (
              <div key={image.id || index} className="relative group">
                <Image
                  src={image.image_url}
                  alt={`${activity.name} ${index + 1}`}
                  className="w-full h-48 object-cover rounded"
                  width={300}
                  height={200}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDeleteImage(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
