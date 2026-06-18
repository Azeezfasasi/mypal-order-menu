import { Button } from "@/components/ui/button";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";

import { Plus } from "lucide-react";

import React, { useState } from "react";
import { Form, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface Attraction {
  id: string;
  name: string;
  isActive: boolean;
}

const attractionSchema = z.object({
  name: z.string().min(1, "Attraction name is required"),
});

export default function Attractions() {
  const [showAddAttractionDialog, setShowAddAttractionDialog] = useState(false);

  // State for attractions
  const [attractions, setAttractions] = useState<Attraction[]>([
    { id: "1", name: "Live football matches", isActive: true },
    { id: "2", name: "Live table tennis competitions", isActive: false },
    { id: "3", name: "Live snooker board games", isActive: false },
  ]);

  const attractionForm = useForm<z.infer<typeof attractionSchema>>({
    resolver: zodResolver(attractionSchema),
    defaultValues: { name: "" },
  });

  // Add new attraction
  const onAddAttraction = (data: z.infer<typeof attractionSchema>) => {
    const newId = crypto.randomUUID();
    const newAttraction: Attraction = {
      id: newId,
      name: data.name,
      isActive: false,
    };

    setAttractions([...attractions, newAttraction]);
    attractionForm.reset();
    setShowAddAttractionDialog(false);
    toast.success(`Attraction "${data.name}" added successfully`);
  };

  // Toggle attraction status
  const toggleAttractionStatus = (id: string) => {
    setAttractions(
      attractions.map((attraction) =>
        attraction.id === id
          ? { ...attraction, isActive: !attraction.isActive }
          : attraction
      )
    );
  };

  // Delete attraction
  const handleDeleteAttraction = (id: string) => {
    setAttractions(attractions.filter((attraction) => attraction.id !== id));
    toast.success("Attraction deleted successfully");
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary">Attractions</h2>
        <Button
          onClick={() => setShowAddAttractionDialog(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" /> Add attraction
        </Button>
      </div>

      <div className="space-y-2">
        {attractions.map((attraction) => (
          <div
            key={attraction.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-md"
          >
            <span>{attraction.name}</span>
            <div className="flex items-center gap-2">
              <Switch
                checked={attraction.isActive}
                onCheckedChange={() => toggleAttractionStatus(attraction.id)}
              />
              <Button
                variant="outline"
                className="bg-orange-100 border-orange-200 hover:bg-orange-200 text-primary"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-gray-700"
                onClick={() => handleDeleteAttraction(attraction.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Attraction Dialog */}
      <Dialog
        open={showAddAttractionDialog}
        onOpenChange={setShowAddAttractionDialog}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add attraction</DialogTitle>
          </DialogHeader>
          <Form {...attractionForm}>
            <form
              onSubmit={attractionForm.handleSubmit(onAddAttraction)}
              className="space-y-4 py-4"
            >
              <FormField
                control={attractionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attraction name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter attraction name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddAttractionDialog(false);
                    attractionForm.reset();
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
