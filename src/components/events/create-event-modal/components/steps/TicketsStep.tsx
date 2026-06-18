"use client";

import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "../../types";

interface TicketsStepProps {
  form: UseFormReturn<EventFormValues>;
  onAddTicket: () => void;
  onRemoveTicket: (index: number) => void;
}

export const TicketsStep = ({
  form,
  onAddTicket,
  onRemoveTicket,
}: TicketsStepProps) => {
  return (
    <div className="space-y-6">
      {form.watch("tickets").map((_, index) => (
        <div key={index} className="space-y-4 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Ticket {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveTicket(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          <FormField
            control={form.control}
            name={`tickets.${index}.ticket_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ticket Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Early Bird" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`tickets.${index}.price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`tickets.${index}.total_tickets`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Tickets Available *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={onAddTicket}>
        <Plus className="h-4 w-4 mr-2" />
        Add Ticket
      </Button>
    </div>
  );
};
