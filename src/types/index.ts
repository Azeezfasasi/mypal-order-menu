import { Gender, Provider } from "./enums";

export type StatusFilter = "" | "approved" | "pending" | "declined";

export interface IUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string | null;
  gender: Gender | null;
  birthday: string | null;
  image_url: string | null;
  is_active: boolean;
  role: string;
  address: string | null;
  long: number | null;
  lat: number | null;
  wallet: number;
  password?: string | null; // Optional as it might not always be sent/needed
  provider: Provider;
  current_token?: string | null; // Optional as it might not always be sent/needed
  createdAt: string; // User's creation date
  updatedAt: string;
  deletedAt?: string | null;
  referralCode?: string;
  loyality_point?: number;
  payment_pin?: string | null;
}

export interface IUserExperience {
  id: string;
  title: string;
  description: string;
  media_urls: string[];
  user: IUser;
  createdAt: string;
  updatedAt: string;
}
