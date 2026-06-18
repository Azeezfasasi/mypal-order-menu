"use client";

import { AlertCircle, Clock, Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Loader from "@/components/shared/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// Types
interface AvailabilitySlot {
  id: number;
  day: string;
  meal_type: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
}

interface BuffetCategory {
  id: string;
  name: string;
  category_type: string;
  serviceType: string;
  availability: AvailabilitySlot[];
}

interface CategoryAvailabilityResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    business: {
      id: string;
      name: string;
    };
    categories: BuffetCategory[];
  };
}

// Validation schema
const availabilitySlotSchema = z.object({
  day: z.string().min(1, "Day is required"),
  meal_type: z.string().min(1, "Meal type is required"),
  opening_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  closing_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  is_active: z.boolean().default(true),
});

type AvailabilitySlotFormData = z.infer<typeof availabilitySlotSchema>;

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface ServiceAvailabilityProps {
  categoryId: string;
}

export default function BuffetServiceAvailability({
  categoryId,
}: ServiceAvailabilityProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<BuffetCategory | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AvailabilitySlotFormData>({
    resolver: zodResolver(availabilitySlotSchema),
    defaultValues: {
      day: "",
      meal_type: "",
      opening_time: "08:00",
      closing_time: "22:00",
      is_active: true,
    },
  });

  // Fetch availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Replace with actual API endpoint
        const response = await fetch(
          `/api/v1/category/availability/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch availability data");
        }

        const data: CategoryAvailabilityResponse = await response.json();

        if (data.data?.categories?.length > 0) {
          setCurrentCategory(data.data.categories[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching availability",
        );
        toast.error("Failed to load availability data");
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryId) {
      fetchAvailability();
    }
  }, [categoryId]);

  // Handle add new slot
  const handleAddSlot = async (data: AvailabilitySlotFormData) => {
    if (!currentCategory) return;

    try {
      setIsSaving(true);

      // Call API to add availability slot
      const response = await fetch(
        `/api/v1/category/availability/${categoryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add availability slot");
      }

      await response.json();

      // Update local state
      setCurrentCategory({
        ...currentCategory,
        availability: [
          ...currentCategory.availability,
          {
            id: Date.now(),
            ...data,
          },
        ],
      });

      toast.success("Availability slot added successfully");
      form.reset();
      setShowDialog(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add availability slot",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update slot
  const handleUpdateSlot = async (
    slotId: number,
    data: AvailabilitySlotFormData,
  ) => {
    try {
      setIsSaving(true);

      // Call API to update availability slot
      const response = await fetch(`/api/v1/category/availability/${slotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update availability slot");
      }

      // Update local state
      if (currentCategory) {
        setCurrentCategory({
          ...currentCategory,
          availability: currentCategory.availability.map((slot) =>
            slot.id === slotId ? { ...slot, ...data } : slot,
          ),
        });
      }

      toast.success("Availability slot updated successfully");
      setEditingSlotId(null);
      form.reset();
      setShowDialog(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update availability slot",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete slot
  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm("Are you sure you want to delete this availability slot?"))
      return;

    try {
      setIsSaving(true);

      // Call API to delete availability slot
      const response = await fetch(`/api/v1/category/availability/${slotId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete availability slot");
      }

      // Update local state
      if (currentCategory) {
        setCurrentCategory({
          ...currentCategory,
          availability: currentCategory.availability.filter(
            (slot) => slot.id !== slotId,
          ),
        });
      }

      toast.success("Availability slot deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete availability slot",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit slot
  const handleEditClick = (slot: AvailabilitySlot) => {
    setEditingSlotId(slot.id);
    form.reset({
      day: slot.day,
      meal_type: slot.meal_type,
      opening_time: slot.opening_time,
      closing_time: slot.closing_time,
      is_active: slot.is_active,
    });
    setShowDialog(true);
  };

  // Handle add new slot click
  const handleAddNewSlot = () => {
    setEditingSlotId(null);
    form.reset();
    setShowDialog(true);
  };

  const onSubmit = async (data: AvailabilitySlotFormData) => {
    if (editingSlotId) {
      await handleUpdateSlot(editingSlotId, data);
    } else {
      await handleAddSlot(data);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader message="Loading availability data..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!currentCategory) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No category data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg md:text-base">
              Service Availability
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage availability slots for {currentCategory.name}
            </p>
          </div>
          <Button
            onClick={handleAddNewSlot}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentCategory.availability.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No availability slots configured yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddNewSlot}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentCategory.availability.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Day
                      </p>
                      <p className="text-gray-900 font-medium">{slot.day}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Meal Type
                      </p>
                      <p className="text-gray-900 font-medium">
                        {slot.meal_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Hours
                      </p>
                      <p className="text-gray-900 font-medium">
                        {slot.opening_time} - {slot.closing_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </p>
                      <p className="text-gray-900 font-medium">
                        {slot.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 md:self-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(slot)}
                      disabled={isSaving}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSlotId
                ? "Edit Availability Slot"
                : "Add Availability Slot"}
            </DialogTitle>
            <DialogDescription>
              {editingSlotId
                ? "Update the availability details for this slot"
                : "Create a new availability slot for this meal/service"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
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
                name="meal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Breakfast, Lunch, Dinner"
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
                  name="opening_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closing_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Active</FormLabel>
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

              <DialogFooter className="gap-2 md:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    form.reset();
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingSlotId ? "Update" : "Add"} Slot
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
