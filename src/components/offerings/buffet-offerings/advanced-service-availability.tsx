"use client";

import { AlertCircle, ChevronDown, Edit2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BuffetAvailabilityApi } from "@/services/api/buffet-availability-api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  IAvailabilitySlot,
  IBuffetCategory,
} from "@/types/buffet-availability-types";
import { BusinessCategoryType } from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";

// Only allow editing: day, opening_time, closing_time, is_active
const availabilitySlotSchema = z.object({
  day: z.string().min(1, "Day is required"),
  opening_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  closing_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
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

const getCategoryIcon = (categoryType: string): string => {
  switch (categoryType.toLowerCase()) {
    case "buffet_meal":
      return "🍽️";
    case "special_offer":
      return "⭐";
    default:
      return "📋";
  }
};

export default function AdvancedBuffetServiceAvailability() {
  // Get signed-in business category from Zustand
  const business = useAuthStore((state) => state.business);
  const isBuffetBusiness =
    business?.category?.business_type === BusinessCategoryType.BUFFET;

  // Only fetch data if business is buffet type
  const {
    data: allAvailabilityData,
    isLoading,
    error,
  } = BuffetAvailabilityApi.useGetAllAvailability(
    isBuffetBusiness ? {} : undefined,
  );
  const updateMutation = BuffetAvailabilityApi.useUpdateAvailability();

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [categories, setCategories] = useState<IBuffetCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const form = useForm<AvailabilitySlotFormData>({
    resolver: zodResolver(availabilitySlotSchema),
    defaultValues: {
      day: "",
      opening_time: "08:00",
      closing_time: "17:00",
      is_active: true,
    },
  });

  useEffect(() => {
    if (allAvailabilityData?.data?.categories) {
      setCategories(allAvailabilityData.data.categories);
      // Expand first category by default
      if (allAvailabilityData.data.categories.length > 0) {
        setExpandedCategories(
          new Set([allAvailabilityData.data.categories[0].id]),
        );
      }
    }
  }, [allAvailabilityData]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleUpdateSlot = async (
    slotId: string,
    data: AvailabilitySlotFormData,
  ) => {
    try {
      await updateMutation.mutateAsync({
        availabilityId: slotId,
        data: {
          day: data.day,
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          is_active: data.is_active,
        },
      });
      form.reset();
      setShowDialog(false);
      setEditingSlotId(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditClick = (slot: IAvailabilitySlot) => {
    setEditingSlotId(slot.id.toString());
    form.reset({
      day: slot.day,
      opening_time: slot.opening_time || "08:00",
      closing_time: slot.closing_time || "17:00",
      is_active: slot.is_active,
    });
    setShowDialog(true);
  };

  const onSubmit = async (data: AvailabilitySlotFormData) => {
    if (editingSlotId) {
      await handleUpdateSlot(editingSlotId, data);
    }
  };

  // Hide if not a buffet business
  if (!isBuffetBusiness) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader message="Loading availability..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading availability data</AlertDescription>
      </Alert>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>No availability slots found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">
            Meal Service Availability
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Manage availability for each meal service
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-xl">
                    {getCategoryIcon(category.category_type)}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.availability?.length || 0} slots
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-600 transition-transform ${
                    expandedCategories.has(category.id) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Category Content - Availability Table */}
              {expandedCategories.has(category.id) && (
                <div className="p-4 bg-white">
                  {category.availability && category.availability.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="font-semibold">Day</TableHead>
                            <TableHead className="font-semibold">
                              Hours
                            </TableHead>
                            <TableHead className="font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.availability.map((slot) => (
                            <TableRow
                              key={slot.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium text-gray-900">
                                {slot.day}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {slot.opening_time && slot.closing_time
                                  ? `${slot.opening_time} - ${slot.closing_time}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    slot.is_active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {slot.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClick(slot)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-500 py-4">
                      No availability slots configured
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Availability Slot</DialogTitle>
            <DialogDescription>Update the slot details</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
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
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-sm">Active</FormLabel>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
