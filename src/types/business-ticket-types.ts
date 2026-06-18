import { TicketAgeGroup } from "./enums";

export interface ICreateBusinessTicket {
  ticket_name: string;
  ticket_type: string;
  price: number;
  age_group: TicketAgeGroup;
}

export type IUpdateBusinessTicket = Partial<ICreateBusinessTicket>;

export interface IBusinessTicket {
  id: string;
  ticket_name: string;
  ticket_type: string;
  price: number;
  age_group: TicketAgeGroup;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
