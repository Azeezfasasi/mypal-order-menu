/**
 * Nightlife Business Types and Interfaces
 */

export interface INightlifeReservation {
  id: string;
  businessId: string;
  type: "bar" | "lounge";
  guestName: string;
  email: string;
  phone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  specialRequests?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface ICreateReservationDto {
  type: "bar" | "lounge";
  guestName: string;
  email: string;
  phone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  specialRequests?: string;
}

export interface IUpdateReservationDto {
  guestName?: string;
  email?: string;
  phone?: string;
  partySize?: number;
  reservationDate?: string;
  reservationTime?: string;
  specialRequests?: string;
  status?: "pending" | "confirmed" | "cancelled";
}

export interface INightlifeEvent {
  id: string;
  businessId: string;
  event_title: string;
  about: string;
  event_type: "ticket" | "reservation" | "informative";
  event_class: "regular" | "exclusive";
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  location: string;
  is_eighten_plus: boolean;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICreateEventDto {
  event_title: string;
  about: string;
  event_type: "ticket" | "reservation" | "informative";
  event_class: "regular" | "exclusive";
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  location: string;
  is_eighten_plus: boolean;
  images?: File[];
}

export interface IUpdateEventDto {
  event_title?: string;
  about?: string;
  event_type?: "ticket" | "reservation" | "informative";
  event_class?: "regular" | "exclusive";
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  location?: string;
  is_eighten_plus?: boolean;
  images?: File[];
  status?: "draft" | "published" | "cancelled";
}

export interface INightlifeProfile {
  id: string;
  businessName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateProfileDto {
  businessName?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

export interface INightlifeBusiness {
  id: string;
  businessName: string;
  description: string;
  location: string;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INightlifeAnalytics {
  totalReservations: number;
  totalEvents: number;
  activeListings: number;
  revenue: number;
  topCategory: string;
  reservationTrend: Array<{
    date: string;
    count: number;
  }>;
}
