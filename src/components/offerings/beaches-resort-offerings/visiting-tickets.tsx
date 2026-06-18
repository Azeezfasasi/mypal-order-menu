"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils"; // Assuming this utility exists and is correctly imported
import { BusinessTicketApi } from "@/services/api/business-ticket-api"; // Assuming this is the correct path
import type {
  IBusinessTicket,
  ICreateBusinessTicket,
  IUpdateBusinessTicket,
} from "@/types/business-ticket-types"; // Ensure IBusinessTicket is imported
import { TicketAgeGroup } from "@/types/enums"; // Assuming this is the correct path
import {
  AlertCircle,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useState } from "react"; // Added React import for clarity
import { toast } from "sonner";

// Helper function to determine badge color based on ticket type/name
const getTicketTypeColor = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("gold"))
    return "bg-yellow-500 hover:bg-yellow-600 text-white";
  if (lowerName.includes("diamond"))
    return "bg-blue-500 hover:bg-blue-600 text-white";
  if (lowerName.includes("premium"))
    return "bg-purple-500 hover:bg-purple-600 text-white";
  if (lowerName.includes("platinum"))
    return "bg-gray-600 hover:bg-gray-700 text-white";
  if (lowerName.includes("silver"))
    return "bg-slate-500 hover:bg-slate-600 text-white";
  return "bg-sky-500 hover:bg-sky-600 text-white"; // Default color
};

// Predefined ticket types for the select dropdown
const PREDEFINED_TICKET_TYPES = [
  "Gold Pass",
  "Diamond Entry",
  "Premium Access",
  "Silver Pass",
  "Platinum VIP",
  "Standard Admission",
  "Event Special",
];

export default function VisitingTicketsSection() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customTicketType, setCustomTicketType] = useState("");
  const [selectedPredefined, setSelectedPredefined] = useState<string | null>(
    null,
  );
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  // Keep a string-backed input state for price so users can clear the field
  // without the controlled numeric state immediately resetting to 0.
  const [priceInput, setPriceInput] = useState<string>("");

  // State for the ticket form data
  const [ticketFormData, setTicketFormData] = useState<ICreateBusinessTicket>({
    ticket_name: "",
    ticket_type: "", // This will hold either predefined or custom
    price: 0,
    age_group: TicketAgeGroup.ADULT,
  });

  // Fetching tickets
  const {
    data: ticketsResponse,
    isLoading: isLoadingTickets,
    isError: isErrorTickets,
    error: ticketsError,
  } = BusinessTicketApi.useGetBusinessTickets();

  // Mutations for CRUD operations
  const { mutate: createTicket, isPending: isCreatingTicket } =
    BusinessTicketApi.useCreateBusinessTicket();

  const {
    mutate: updateTicket,
    isPending: isUpdatingTicket, // Added loading state for update
  } = BusinessTicketApi.useUpdateBusinessTicket();

  const {
    mutate: deleteTicket,
    // isPending: isDeletingTicket, // Can be added if specific UI feedback for delete loading is needed beyond toast
  } = BusinessTicketApi.useDeleteBusinessTicket();

  // Handle input changes for text fields (except price which is handled separately)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "price") {
      // update the string-backed price input only
      setPriceInput(value);
      return;
    }
    setTicketFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Sync the string price input into the numeric form state on blur (or on submit)
  const handlePriceBlur = () => {
    setTicketFormData((prev) => ({
      ...prev,
      price: priceInput === "" ? 0 : parseFloat(priceInput) || 0,
    }));
  };

  // Handle age group selection change
  const handleAgeGroupSelectChange = (value: string) => {
    setTicketFormData((prev) => ({
      ...prev,
      age_group: value as TicketAgeGroup,
    }));
  };

  // Handle predefined ticket type selection
  const handlePredefinedTicketTypeSelect = (value: string) => {
    setSelectedPredefined(value);
    setTicketFormData((prev) => ({ ...prev, ticket_type: value }));
    setCustomTicketType(value);
  };

  // Handle custom ticket type input change
  const handleCustomTicketTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const customValue = e.target.value;
    setCustomTicketType(customValue);
    setTicketFormData((prev) => ({ ...prev, ticket_type: customValue }));
    setSelectedPredefined(null); // Clear predefined selection when typing custom
  };

  // Handle form submission (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = Boolean(editingTicketId);

    // Ensure ticket_type is set, defaulting to customTicketType if it's filled
    // This handles cases where user types in custom field without interacting with select
    // Ensure numeric price is derived from priceInput (so users can submit cleared input)
    const priceNumber = priceInput === "" ? 0 : parseFloat(priceInput) || 0;

    const finalTicketData = {
      ...ticketFormData,
      price: priceNumber,
      ticket_type: ticketFormData.ticket_type || customTicketType,
    };

    if (!finalTicketData.ticket_type && customTicketType) {
      finalTicketData.ticket_type = customTicketType;
    }

    if (
      !finalTicketData.ticket_name.trim() ||
      !finalTicketData.ticket_type.trim()
    ) {
      toast.error("Ticket name and type cannot be empty.");
      return;
    }

    const promise = new Promise<void>((resolve, reject) => {
      if (isEditing && editingTicketId) {
        updateTicket(
          {
            ticketId: editingTicketId,
            data: finalTicketData as IUpdateBusinessTicket,
          },
          { onSuccess: () => resolve(), onError: reject },
        );
      } else {
        createTicket(finalTicketData, {
          onSuccess: () => resolve(),
          onError: reject,
        });
      }
    });

    toast.promise(promise, {
      loading: isEditing ? "Updating ticket..." : "Creating ticket...",
      success: () => {
        setIsAddModalOpen(false);
        setEditingTicketId(null);
        // Reset form states
        setTicketFormData({
          ticket_name: "",
          ticket_type: "",
          price: 0,
          age_group: TicketAgeGroup.ADULT,
        });
        setCustomTicketType("");
        setPriceInput("");
        setSelectedPredefined(null);
        return isEditing
          ? "Ticket updated successfully!"
          : "Ticket created successfully!";
      },
      error: (err) =>
        `${isEditing ? "Update" : "Creation"} failed: ${
          err?.message || "Unknown error"
        }`,
    });
  };

  // Handle clicking the "Edit" button for a ticket
  const handleEditClick = (ticket: IBusinessTicket) => {
    setIsAddModalOpen(true);
    setEditingTicketId(ticket.id);
    setSelectedPredefined(
      PREDEFINED_TICKET_TYPES.includes(ticket.ticket_type)
        ? ticket.ticket_type
        : null,
    );
    setTicketFormData({
      ticket_name: ticket.ticket_name,
      ticket_type: ticket.ticket_type,
      // Ensure price is a number (strip any leading zeros if API returned a string)
      price: Number(ticket.price) || 0,
      age_group: ticket.age_group,
    });
    // Populate custom type input as well
    setCustomTicketType(ticket.ticket_type);
    // Initialize the string price input (strip leading zeros)
    setPriceInput(String(Number(ticket.price) || ""));
  };

  // Handle clicking the "Delete" button for a ticket
  const handleDeleteClick = (ticketId: string) => {
    // Optional: Add a confirmation dialog here using sonner or another modal
    // For example: if (!confirm("Are you sure you want to delete this ticket?")) return;

    const promise = new Promise<void>((resolve, reject) => {
      deleteTicket(ticketId, {
        onSuccess: () => resolve(),
        onError: reject,
      });
    });

    toast.promise(promise, {
      loading: "Deleting ticket...",
      success: "Ticket deleted successfully!",
      error: (err) => `Delete failed: ${err?.message || "Unknown error"}`,
    });
  };

  const businessTickets: IBusinessTicket[] = ticketsResponse?.data || [];

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-bold">
            🎫 Visiting tickets
          </CardTitle>
          <Button
            className="bg-white text-orange-600 hover:bg-orange-50 font-semibold py-2 px-3 sm:px-4 rounded-md text-sm sm:text-base"
            onClick={() => {
              setEditingTicketId(null); // Ensure not in edit mode
              setSelectedPredefined(null); // Reset predefined selection
              setTicketFormData({
                // Reset form data
                ticket_name: "",
                ticket_type: "",
                price: 0,
                age_group: TicketAgeGroup.ADULT,
              });
              setCustomTicketType(""); // Reset custom ticket type field
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            Add option
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-800 text-base">
                  Available Ticket Options
                </span>
              </div>
            </div>
            {isLoadingTickets ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading tickets...</span>
              </div>
            ) : isErrorTickets ? (
              <div className="flex flex-col items-center justify-center p-10 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="h-8 w-8 mr-2 mb-2" />
                <span className="font-semibold">Error loading tickets</span>
                <span className="text-sm">
                  {(ticketsError as Error)?.message ||
                    "An unknown error occurred."}
                </span>
              </div>
            ) : businessTickets.length === 0 ? (
              <p className="text-gray-500 italic text-center py-6">
                No business tickets available. Click &quot;Add option&quot; to
                create one.
              </p>
            ) : (
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 grid-cols-3 gap-4">
                {businessTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 rounded-lg shadow-md flex flex-col justify-between transition-all hover:shadow-lg ${getTicketTypeColor(
                      ticket.ticket_type, // Color based on ticket_type
                    )}`}
                  >
                    <div>
                      <h3
                        className="text-sm font-semibold truncate"
                        title={ticket.ticket_name}
                      >
                        {ticket.ticket_name}
                      </h3>
                      <p className="text-xs opacity-90">
                        {ticket.ticket_type} - {ticket.age_group}
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {formatCurrency(Number(ticket.price) || 0)}
                      </p>
                    </div>
                    <div className="flex gap-1 mt-2 self-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-7 w-7"
                        onClick={() => handleEditClick(ticket)}
                        title="Edit ticket"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20 h-7 w-7"
                        onClick={() => handleDeleteClick(ticket.id)}
                        title="Delete ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Ticket Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-lg shadow-xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {editingTicketId ? "Edit Ticket Option" : "Add New Ticket Option"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-1">
              {editingTicketId
                ? "Update the details for this ticket."
                : "Fill in the details to create a new ticket."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 px-1 py-2">
            <div>
              <Label
                htmlFor="ticket_name"
                className="text-sm font-medium text-gray-700"
              >
                Ticket Name
              </Label>
              <Input
                id="ticket_name"
                name="ticket_name"
                placeholder="e.g., Weekend Adult Pass"
                value={ticketFormData.ticket_name}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="ticket_type_select"
                className="text-sm font-medium text-gray-700"
              >
                Ticket Type
              </Label>
              <Select
                value={selectedPredefined ?? ""}
                onValueChange={handlePredefinedTicketTypeSelect}
              >
                <SelectTrigger id="ticket_type_select" className="mt-1">
                  <SelectValue placeholder="Select predefined type" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_TICKET_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                name="custom_ticket_type"
                placeholder="Enter custom type"
                value={customTicketType}
                onChange={handleCustomTicketTypeChange}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="price"
                  className="text-sm font-medium text-gray-700"
                >
                  Price
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onBlur={handlePriceBlur}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="age_group_select"
                  className="text-sm font-medium text-gray-700"
                >
                  Age Group
                </Label>
                <Select
                  value={ticketFormData.age_group}
                  onValueChange={handleAgeGroupSelectChange}
                >
                  <SelectTrigger id="age_group_select" className="mt-1">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TicketAgeGroup).map((group) => (
                      <SelectItem
                        key={group}
                        value={group}
                        className="capitalize"
                      >
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-5 gap-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-md">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isCreatingTicket || isUpdatingTicket}
                className="rounded-md min-w-[120px]"
              >
                {(isCreatingTicket || isUpdatingTicket) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingTicketId
                  ? isUpdatingTicket
                    ? "Updating..."
                    : "Update Ticket"
                  : isCreatingTicket
                    ? "Creating..."
                    : "Create Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
