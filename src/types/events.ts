// Event management types
export interface Event {
  id: number;
  name: string;
  dateCreated: string;
  eventType: "Regular" | "Exclusive";
  amount: string;
  status: "Approved" | "Disapproved";
}

export interface EventCategory {
  id: number;
  name: string;
  events: string[];
}

export interface EventFormData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  duration: string;
  startTime: string;
  endTime: string;
  aboutEvent: string;
  adultContent: boolean;
  flyerColor: string;
  flyerTone: "Trendy" | "Fun" | "Professional";
  actionType: "Make reservation" | "Buy tickets" | "Plain (Informative)";
}

export interface TicketPackage {
  id: number;
  name: string;
  price: string;
}

export interface TransactionSettings {
  vat: boolean;
  serviceCharge: boolean;
  discountAllocated: {
    enabled: boolean;
    value: string;
  };
}
