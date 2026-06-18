import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ticketFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(["low", "medium", "high"]),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export function TicketDialogForm() {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
  });

  const onSubmit = (data: TicketFormValues) => {
    console.log("Submitted", data);
    // TODO: handle submission logic
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Create Ticket</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit a new support ticket.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register("subject")} />
            {errors.subject && (
              <p className="text-sm text-red-500 mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" {...register("message")} />
            {errors.message && (
              <p className="text-sm text-red-500 mt-1">
                {errors.message.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              onValueChange={(value) =>
                setValue("priority", value as TicketFormValues["priority"])
              }
            >
              <SelectTrigger
                className={cn("w-full", errors.priority && "border-red-500")}
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-500 mt-1">
                {errors.priority.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
