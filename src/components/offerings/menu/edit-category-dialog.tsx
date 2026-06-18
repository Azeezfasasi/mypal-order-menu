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
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  id: z.string().optional(), // Add an ID field for editing
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  serviceType: z.nativeEnum(ServiceType),
  category_type: z.nativeEnum(CategoryType).optional(),
  price_per_child: z.number().min(0).optional(),
  price_per_adults: z.number().min(0).optional(),
  parentCategory: z.string().optional(),
  hasSubcategories: z.boolean().default(false),
});

export type FormValues = z.infer<typeof formSchema>; // Exporting for external use

interface EditCategoryDialogProps {
  initialData: FormValues; // Data of the category to be edited
  onEditCategory: (values: FormValues) => void;
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
}

export function EditCategoryDialog({
  initialData,
  onEditCategory,
  buttonText = "Edit Category",
  triggerButtonVariant = "default",
  triggerButtonClassName = "bg-blue-600 text-white", // Changed default color for differentiation
  triggerButtonSize = "sm",
  icon,
}: EditCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData, // Populate form with initial data
  });

  React.useEffect(() => {
    // Reset form with new initialData if it changes (e.g., when editing a different category)
    form.reset(initialData);
  }, [initialData, form]);

  const onSubmit = (values: FormValues) => {
    onEditCategory(values);
    setOpen(false);
  };

  const serviceType = form.watch("serviceType");
  const isBuffet = serviceType === ServiceType.BUFFET;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerButtonVariant}
          size={triggerButtonSize}
          className={triggerButtonClassName}
        >
          {icon}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Modify the details for the category &quot;{initialData.name}&quot;.
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

            <FormField
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
            />

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
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
