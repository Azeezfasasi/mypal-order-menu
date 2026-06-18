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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContextType } from "@/types/enums";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "../../types";

interface AdditionalDetailsStepProps {
  form: UseFormReturn<EventFormValues>;
  onAddBenefit: () => void;
  onRemoveBenefit: (index: number) => void;
  onAddAgenda: () => void;
  onRemoveAgenda: (index: number) => void;
}

export const AdditionalDetailsStep = ({
  form,
  onAddBenefit,
  onRemoveBenefit,
  onAddAgenda,
  onRemoveAgenda,
}: AdditionalDetailsStepProps) => {
  const [agendaTypeOpen, setAgendaTypeOpen] = useState<{
    [key: number]: boolean;
  }>({});

  return (
    <div className="space-y-6">
      {/* Event Benefits */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Event Benefits</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddBenefit}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {form.watch("benefits").map((_, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Benefit {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveBenefit(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>

            <FormField
              control={form.control}
              name={`benefits.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter benefit title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`benefits.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter benefit description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>

      {/* Event Agenda */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Event Agenda</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onAddAgenda}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {form.watch("agendas").map((_, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Agenda Item {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveAgenda(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name={`agendas.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter agenda title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`agendas.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter agenda description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`agendas.${index}.agendaType`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setAgendaTypeOpen({
                          ...agendaTypeOpen,
                          [index]: false,
                        });
                      }}
                      open={agendaTypeOpen[index]}
                      onOpenChange={(open) =>
                        setAgendaTypeOpen({ ...agendaTypeOpen, [index]: open })
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper"
                        sideOffset={4}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        {Object.values(ContextType).map((type) => (
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
