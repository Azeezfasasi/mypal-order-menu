// Type definitions for beaches resort offerings
export interface TicketType {
  id: number;
  name: string;
  price: string;
  type: "adult" | "children";
}

export interface GuestSize {
  id: number;
  name: string;
  active: boolean;
}

export interface Event {
  id: number;
  name: string;
  agenda: string;
  date: string;
  time: string;
  venue: string;
  tickets: string;
}

export interface ActivityPricing {
  priceAdult: string;
  priceChild: string;
  time: string;
}

export interface Activity {
  id: number;
  name: string;
  image: string;
  description: string;
  pricing: ActivityPricing[];
}

export interface Accommodation {
  id: number;
  name: string;
  images: string;
  availability: string;
  description: string;
}

export interface Attraction {
  id: number;
  name: string;
  enabled: boolean;
}

export interface TransactionInfo {
  vat: boolean;
  serviceCharge: boolean;
  discountAllocated: {
    enabled: boolean;
    value: string;
  };
}

export interface BeachesResortData {
  visitingTickets: {
    ticketTypes: TicketType[];
    guestSizes: GuestSize[];
  };
  upcomingEvents: Event[];
  activities: Activity[];
  accommodations: Accommodation[];
  attractions: Attraction[];
  transactionInfo: TransactionInfo;
}
