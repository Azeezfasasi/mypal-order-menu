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
import { Textarea } from "@/components/ui/textarea";
import { dummySets } from "@/data";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileUploader } from "../shared/FileUploader";

const mealDetailSchema = z.object({
  mealType: z.string().min(1, "Required"),
  cuisine: z.string().min(1, "Required"),
  dish: z.string().min(1, "Required"),
  quantity: z.string().optional(),
  servingFormat: z.string().min(1, "Required"),
  preparationTime: z
    .string()
    .min(1, { message: "Preparation time must be at least 1 minute" })
    .max(300, { message: "Preparation time cannot exceed 300 minutes" }),
});

const quantityOptionSchema = z.object({
  label: z.string().min(1, "Label is required"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
});

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number" })
    .optional(),
  description: z.string().optional(),
  preparation_time: z.coerce
    .number()
    .min(1, { message: "Preparation time must be at least 1 minute" })
    .max(300, { message: "Preparation time cannot exceed 300 minutes" })
    .optional(),
  category_id: z.string(),
  mealDetail: mealDetailSchema.optional(),
  quantityOptions: z.array(quantityOptionSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddItemDialogProps {
  categoryId: string;
  categoryName: string;
  onAddItem: (values: FormValues & { images?: File[] }) => void;
  buttonText?: string;
  isBuffet?: boolean;
}

export function AddItemDialog({
  categoryId,
  categoryName,
  onAddItem,
  buttonText = "Add new item",
  isBuffet = false,
}: AddItemDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [imageFiles, setImageFiles] = React.useState<File[] | null>(null);
  const [imagePreviews, setImagePreviews] = React.useState<string[] | null>(
    null
  );
  const [quantityOptions, setQuantityOptions] = React.useState<
    Array<{ label: string; price: number }>
  >([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      preparation_time: undefined,
      category_id: categoryId,
    },
  });

  const handleFileChange = (files: File[] | null) => {
    setImageFiles(files);
  };

  const handleFilePreviewChange = (previews: string[] | null) => {
    setImagePreviews(previews);
  };

  const handleAddQuantityOption = () => {
    setQuantityOptions([...quantityOptions, { label: "", price: 0 }]);
  };

  const handleRemoveQuantityOption = (index: number) => {
    setQuantityOptions(quantityOptions.filter((_, i) => i !== index));
  };

  const handleQuantityOptionChange = (
    index: number,
    field: "label" | "price",
    value: string | number
  ) => {
    const updated = [...quantityOptions];
    if (field === "label") {
      updated[index].label = value as string;
    } else {
      updated[index].price = Number(value);
    }
    setQuantityOptions(updated);
    form.setValue("quantityOptions", updated);
  };

  const onSubmit = (values: FormValues) => {
    // Filter out invalid quantity options (must have both label and price)
    const validQuantityOptions = quantityOptions.filter(
      (opt) => opt.label && opt.label.trim() !== "" && opt.price > 0
    );
    
    // If quantityOptions are provided, exclude the price field completely
    const hasQuantityOptions = validQuantityOptions && validQuantityOptions.length > 0;
    
    // Construct payload excluding quantityOptions from form values
    // We'll add the valid quantity options separately if they exist
    let valuesWithoutQuantityOptions = Object.fromEntries(
      Object.entries(values).filter(([key]) => key !== 'quantityOptions')
    ) as Omit<FormValues, 'quantityOptions'>;
    
    // If quantity options are provided, exclude the price field as prices come from options
    if (hasQuantityOptions) {
      valuesWithoutQuantityOptions = Object.fromEntries(
        Object.entries(valuesWithoutQuantityOptions).filter(([key]) => key !== 'price')
      ) as Omit<FormValues, 'quantityOptions'>;
    }
    
    const payload: FormValues & { images?: File[] } = {
      ...valuesWithoutQuantityOptions,
      category_id: values.category_id,
      ...(hasQuantityOptions && { quantityOptions: validQuantityOptions }),
      ...(imageFiles && imageFiles.length > 0 && { images: imageFiles }),
    };
    
    console.log("[DEBUG] Payload being sent to onAddItem:", {
      payload,
      validQuantityOptions,
      hasQuantityOptions,
      quantityOptionsIncluded: "quantityOptions" in payload,
    });
    
    onAddItem(payload);
    form.reset();
    setImageFiles(null);
    setImagePreviews(null);
    setQuantityOptions([]);
    setOpen(false);
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form and file states when dialog closes
      form.reset();
      setImageFiles(null);
      setImagePreviews(null);
      setQuantityOptions([]);
    }
    setOpen(newOpen);
  };

  const [dummyIndex, setDummyIndex] = React.useState(0);

  const fillDummyData = () => {
    const dummy = dummySets[dummyIndex];
    form.setValue("name", dummy.name);
    form.setValue("price", dummy.price);
    form.setValue("description", dummy.description);
    form.setValue("preparation_time", dummy.preparation_time);
    form.setValue("mealDetail.mealType", dummy.mealDetail.mealType);
    form.setValue("mealDetail.cuisine", dummy.mealDetail.cuisine);
    form.setValue("mealDetail.dish", dummy.mealDetail.dish);
    form.setValue("mealDetail.servingFormat", dummy.mealDetail.servingFormat);
    form.setValue(
      "mealDetail.preparationTime",
      dummy.mealDetail.preparationTime
    );
    setDummyIndex((prev) => (prev + 1) % dummySets.length);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-[#0B5B8C]">
          <Plus className="h-4 w-4 mr-1" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>
            Add a new item to category: &quot;{categoryName}&quot;. Enter its
            details below.
          </DialogDescription>
        </DialogHeader>
        {process.env.NODE_ENV === "development" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillDummyData}
          >
            Fill in Data
          </Button>
        )}
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
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jollof Rice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className={quantityOptions.length > 0 ? "opacity-50 pointer-events-none" : ""}>
                  <FormLabel>Price (₦) {quantityOptions.length > 0 && <span className="text-xs text-muted-foreground ml-2">(disabled while using quantity options)</span>}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      disabled={quantityOptions.length > 0}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the price in Naira without commas or currency symbol
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    {isBuffet && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter item description"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meal Detail Section */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Meal Details</h4>
              <FormField
                control={form.control}
                name="mealDetail.mealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dinner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity Options Section */}
              <div className="space-y-3 border border-dashed rounded-md p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Quantity/Serving Options (Alternative Pricing)</h4>
                  <p className="text-xs text-muted-foreground">{quantityOptions.length} option(s)</p>
                </div>
                
                {quantityOptions.length > 0 && (
                  <div className="space-y-2">
                    {quantityOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-xs font-medium mb-1 block">Label</label>
                          <Input
                            placeholder="e.g. Small, Medium, Large"
                            value={option.label}
                            onChange={(e) =>
                              handleQuantityOptionChange(index, "label", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium mb-1 block">Price (₦)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={option.price}
                            onChange={(e) =>
                              handleQuantityOptionChange(index, "price", e.target.value)
                            }
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuantityOption(index)}
                          className="px-2 py-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuantityOption}
                  className="w-full"
                >
                  + Add Size
                </Button>
                
                {quantityOptions.length > 0 && (
                  <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                    💡 When you add quantity options, the global price field will be ignored. Each option has its own price.
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="mealDetail.cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuisine</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Italian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mealDetail.dish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dish</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main course" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mealDetail.servingFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Format</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Platter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mealDetail.preparationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 30 minutes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <FileUploader
                filePreview={imagePreviews}
                onFileChange={handleFileChange}
                onFilePreviewChange={handleFilePreviewChange}
                inputId="menu-item-image"
                acceptedTypes={["image/jpeg", "image/png"]}
                label="Menu Item Image"
                description="Upload an image of the menu item"
                multiple={true}
              />
            </div>

            <DialogFooter className="gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
