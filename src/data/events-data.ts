import type { Event, EventCategory, TransactionSettings } from "@/types/events";

export const eventsData: Event[] = [
  {
    id: 1,
    name: "Alumni Beach Party",
    dateCreated: "Apr 12, 2023",
    eventType: "Exclusive",
    amount: "₦7,500.00",
    status: "Approved",
  },
  {
    id: 2,
    name: "Alumni Beach Party",
    dateCreated: "Apr 12, 2023",
    eventType: "Regular",
    amount: "₦7,500.00",
    status: "Disapproved",
  },
  {
    id: 3,
    name: "Alumni Beach Party",
    dateCreated: "Apr 12, 2023",
    eventType: "Regular",
    amount: "₦7,500.00",
    status: "Approved",
  },
  {
    id: 4,
    name: "Alumni Beach Party",
    dateCreated: "Apr 12, 2023",
    eventType: "Exclusive",
    amount: "₦7,500.00",
    status: "Approved",
  },
  {
    id: 5,
    name: "Alumni Beach Party",
    dateCreated: "Apr 12, 2023",
    eventType: "Exclusive",
    amount: "₦7,500.00",
    status: "Disapproved",
  },
  {
    id: 6,
    name: "Alumni Beach Party",
    dateCreated: "Apr 12, 2023",
    eventType: "Regular",
    amount: "₦7,500.00",
    status: "Approved",
  },
];

export const eventCategories: EventCategory[] = [
  {
    id: 1,
    name: "Top picks",
    events: ["Easter fiesta", "Tommy's pool party", "Marble fashion show"],
  },
  {
    id: 2,
    name: "Comedy",
    events: ["Apes and capes", "All night laughter", "All night laughter"],
  },
  {
    id: 3,
    name: "Concerts",
    events: ["September to remember", "Easter fiesta"],
  },
  {
    id: 4,
    name: "Fashion shows",
    events: ["Show of planets", "Marble fashion show"],
  },
];

export const transactionSettings: TransactionSettings = {
  vat: true,
  serviceCharge: false,
  discountAllocated: {
    enabled: true,
    value: "20% Discount",
  },
};
