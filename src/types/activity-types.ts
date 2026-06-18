// Interface for the nested User object within the Like response

import { IUser } from ".";
import { IBusiness } from "./auth-types";

export interface ISharedExperience {
  id: number;
  name: string;
  description: string;
  images: string[];
  user: IUser; // Nested user object
}

// Interface for a single Like activity item
export interface ILikeActivityItem {
  id: string; // ID of the Like action itself
  createdAt: string; // Timestamp when the Like occurred
  user: IUser; // Nested user object
}

// Interface for a single Share activity item
export interface IShareActivityItem {
  id: string;
  externalPlatform: string;
  sharedLink: string;
  sharedAt: string;
  sharedBy: IUser;
  business: IBusiness;
}
