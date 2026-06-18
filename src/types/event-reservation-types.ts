import { IUser } from ".";
import { IEvent } from "./event-types";

export interface IEventReservation {
  id: string;
  user: IUser;
  event: IEvent;
  name: string;
  number_of_people: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ICreateEventReservationDto {
  event_id: string;
  name: string;
  number_of_people: number;
}

export interface IUpdateEventReservationDto {
  name?: string;
  number_of_people?: number;
}
