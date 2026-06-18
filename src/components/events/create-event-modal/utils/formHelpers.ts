import { ContextType } from "@/types/enums";
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "../types";

/**
 * Form helper hook for managing dynamic arrays
 */
export const useFormHelpers = (form: UseFormReturn<EventFormValues>) => {
  // Ticket management
  const addTicket = useCallback(() => {
    const currentTickets = form.getValues("tickets");
    const newTickets = [
      ...currentTickets,
      {
        ticket_name: "",
        price: 0,
        total_tickets: 0,
      },
    ];
    console.log("🎫 Added new ticket, total tickets:", newTickets.length);
    form.setValue("tickets", newTickets);
  }, [form]);

  const removeTicket = useCallback(
    (index: number) => {
      const currentTickets = form.getValues("tickets");
      const newTickets = currentTickets.filter((_, i) => i !== index);
      form.setValue("tickets", newTickets);
    },
    [form]
  );

  // Benefits management
  const addBenefit = useCallback(() => {
    const currentBenefits = form.getValues("benefits");
    const newBenefits = [...currentBenefits, { title: "", description: "" }];
    form.setValue("benefits", newBenefits);
  }, [form]);

  const removeBenefit = useCallback(
    (index: number) => {
      const currentBenefits = form.getValues("benefits");
      const newBenefits = currentBenefits.filter(
        (_: unknown, i: number) => i !== index
      );
      form.setValue("benefits", newBenefits);
    },
    [form]
  );

  // Agenda management
  const addAgenda = useCallback(() => {
    const currentAgendas = form.getValues("agendas");
    const newAgendas = [
      ...currentAgendas,
      { title: "", description: "", agendaType: ContextType.EVENT },
    ];
    form.setValue("agendas", newAgendas);
  }, [form]);

  const removeAgenda = useCallback(
    (index: number) => {
      const currentAgendas = form.getValues("agendas");
      const newAgendas = currentAgendas.filter(
        (_: unknown, i: number) => i !== index
      );
      form.setValue("agendas", newAgendas);
    },
    [form]
  );

  return {
    tickets: {
      add: addTicket,
      remove: removeTicket,
    },
    benefits: {
      add: addBenefit,
      remove: removeBenefit,
    },
    agendas: {
      add: addAgenda,
      remove: removeAgenda,
    },
  };
};
