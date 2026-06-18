"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createBuffetOfferingsApi } from "@/services/api/buffet-offerings-api";

// Validation schema for the offer form
const createOfferSchema = z.object({
  caption: z.string().min(3, "Caption must be at least 3 characters"),
  date: z.string().min(1, "Date is required"),
  about: z.string().min(10, "Description must be at least 10 characters"),
  mainCatch: z.string().min(1, "Main catch/category is required"),
  aboutMainCatch: z.string().min(1, "Main catch description is required"),
  gatePass: z.string().optional(),
  gatePassPricingAdult: z.number().optional(),
  gatePassPricingChild: z.number().optional(),
  includeEntryFee: z.boolean().default(false),
  is18Plus: z.boolean().default(false),
  drinkResponsibly: z.boolean().default(false),
  catchyPhrase: z.string().min(1, "Catchy phrase is required"),
  likeable: z.boolean().default(false),
  shareable: z.boolean().default(false),
  image: z.instanceof(File).optional(),
  tags: z.array(z.string()).default([]),
  newTag: z.string().optional(),
});

type CreateOfferFormValues = z.infer<typeof createOfferSchema>;

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string;
  onOfferCreated?: () => void;
}

export const CreateOfferModal = ({
  isOpen,
  onClose,
  categoryId,
  onOfferCreated,
}: CreateOfferModalProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // API hooks
  const buffetOfferingsApi = createBuffetOfferingsApi();
  const { mutateAsync: createOffer, isPending: isSubmitting } =
    buffetOfferingsApi.useCreateBuffetOffer();
  const { createOfferFormData } =
    buffetOfferingsApi.useCreateBuffetOfferFormData();

  const form = useForm<CreateOfferFormValues>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      caption: "",
      date: new Date().toISOString().split("T")[0],
      about: "",
      mainCatch: "",
      aboutMainCatch: "",
      gatePass: "",
      gatePassPricingAdult: undefined,
      gatePassPricingChild: undefined,
      includeEntryFee: false,
      is18Plus: false,
      drinkResponsibly: false,
      catchyPhrase: "",
      likeable: false,
      shareable: false,
      tags: [],
      newTag: "",
    },
  });

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should not exceed 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      form.setValue("image", file);
    }
  };

  // Add tag
  const handleAddTag = useCallback(() => {
    const newTag = form.getValues("newTag");
    if (newTag?.trim()) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(newTag)) {
        form.setValue("tags", [...currentTags, newTag]);
        form.setValue("newTag", "");
      } else {
        toast.error("Tag already exists");
      }
    }
  }, [form]);

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  // Handle form submission
  const onSubmit = async (data: CreateOfferFormValues) => {
    try {
      if (!categoryId) {
        toast.error("Category ID is required");
        return;
      }

      console.log("🔍 [CREATE OFFER] Form submission - Category ID:", categoryId);

      // Validate that all required special offer fields are present
      if (!data.mainCatch || !data.aboutMainCatch || !data.catchyPhrase) {
        toast.error("Please fill in all required special offer details");
        return;
      }

      // For Special Offers: send all required fields (main_catch, main_catch_description, etc.)
      const formData = createOfferFormData(
        {
          name: data.caption,
          category_id: categoryId,
          main_catch: data.mainCatch,
          main_catch_description: data.aboutMainCatch,
          catchy_phrase: data.catchyPhrase,
          gate_pass: data.includeEntryFee,
          is_18_plus: data.is18Plus,
          tags: data.tags || [],
          description: data.about,
          // Include pricing if entry fee is enabled
          ...(data.includeEntryFee && {
            price_per_adults: data.gatePassPricingAdult,
            price_per_child: data.gatePassPricingChild,
          }),
          likeable: data.likeable,
          shareable: data.shareable,
        },
        data.image
      );

      console.log("📤 [CREATE OFFER] Sending to API with categoryId:", categoryId);

      // Call API to create offer
      await createOffer(formData);

      // Reset form and close modal
      form.reset();
      setImagePreview(null);
      onOfferCreated?.();
      onClose();
    } catch (error) {
      console.error("Error creating offer:", error);
      // Error toast is handled by the mutation hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10">
          <DialogTitle>Create a new special offer</DialogTitle>
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
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Buffet brunch, cocktail wednesdays"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* ABOUT SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                About
              </h3>

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type in about...."
                        className="min-h-[120px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Not more than 80 words
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* MAIN CATCH SECTION */}
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aboutMainCatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Main Catch</FormLabel>
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

            {/* ENTRY & ACCESS SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Entry & Access
              </h3>

              <FormField
                control={form.control}
                name="includeEntryFee"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel>Include Entry Fee (Gate Pass)</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("includeEntryFee") && (
                <>
                  <FormField
                    control={form.control}
                    name="gatePass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gate Pass Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Free entry, N5,000 Adult, N2,500 per child"
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
                      name="gatePassPricingAdult"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adult Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
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
                      name="gatePassPricingChild"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
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
                </>
              )}

              <FormField
                control={form.control}
                name="is18Plus"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel>18+ / Drink Responsibly Disclaimer</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            {/* UPLOAD IMAGE SECTION */}
            <section className="space-y-4 border-b pb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Upload Image
              </h3>

              <div className="relative rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="mx-auto max-h-48 rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setImagePreview(null);
                        form.setValue("image", undefined);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-xs text-orange-600">
                      Maximum file size should not exceed 2mb
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </>
                )}
              </div>
            </section>

            {/* ENGAGEMENT SECTION */}
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

            {/* TAGS SECTION */}
            <section className="space-y-4">
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
                          placeholder="Type tag..."
                          {...field}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  className="px-4"
                >
                  Add
                </Button>
              </div>

              {form.watch("tags")?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.watch("tags").map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            {/* ACTION BUTTONS */}
            <div className="sticky bottom-0 space-y-3 border-t bg-white pt-4">
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Offer..." : "Create Offer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={isSubmitting}
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

export default CreateOfferModal;
