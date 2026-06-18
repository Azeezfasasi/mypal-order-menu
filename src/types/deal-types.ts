// src/types/deal-types.ts

import { IBusiness } from "./auth-types";

// ==================================
// Base Interfaces
// ==================================

export interface IDealBenefit {
  id: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDealAgenda {
  id: string;
  title: string;
  deal_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDeal {
  id: string;
  deal_title: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about_deal: string;
  price: number;
  is_eighteen_plus: boolean;
  refine_description: boolean;
  flyer_url: string;
  is_approved: boolean;
  business: IBusiness;
  benefits: IDealBenefit[];
  agendas: IDealAgenda[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Simplified version for list views
export interface IDealListItem {
  id: string;
  deal_title: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about_deal: string;
  price: number;
  is_eighteen_plus: boolean;
  flyer_url: string;
  is_approved: boolean;
  business: IBusiness;
  benefits: IDealBenefit[];
  agendas: IDealAgenda[];
  createdAt: string;
  updatedAt: string;
}

// ==================================
// DTO Interfaces (for API requests)
// ==================================

export interface ICreateDealBenefitDto {
  id?: string; // Optional for updates
  description: string;
}

export interface ICreateDealAgendaDto {
  id?: string; // Optional for updates
  title: string;
  event_id?: string; // Optional for cross-linking with events
}

export interface ICreateDealDto {
  deal_title: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about_deal: string;
  price: number;
  is_eighteen_plus: boolean;
  refine_description: boolean;
  image: File;
  business_id?: string; // Optional for admin
  benefits?: ICreateDealBenefitDto[];
  agendas?: ICreateDealAgendaDto[];
}

export interface IUpdateDealDto {
  deal_title?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  about_deal?: string;
  price?: number;
  is_eighteen_plus?: boolean;
  refine_description?: boolean;
  image?: File;
  benefits?: ICreateDealBenefitDto[];
  agendas?: ICreateDealAgendaDto[];
}

// ==================================
// API Response Interfaces
// ==================================

export interface IDealPaginationOptions {
  page?: number;
  limit?: number;
}

// ==================================
// Filter/Query Interfaces
// ==================================

export interface IDealFilters {
  location?: string;
  startDate?: string;
  endDate?: string;
  isEighteenPlus?: boolean;
  isApproved?: boolean;
}

export interface IDealQueryOptions extends IDealPaginationOptions {
  filters?: IDealFilters;
  sortBy?: "start_date" | "end_date" | "createdAt" | "deal_title" | "price";
  sortOrder?: "ASC" | "DESC";
}

// ==================================
// Form Interfaces (for UI components)
// ==================================

export interface IDealFormData {
  deal_title: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about_deal: string;
  refine_description: boolean;
  flyer_url?: string; // Optional for form input
  image_preference?: "upload" | "generate"; // Optional for form input
  flyer_prompt?: string; // Optional for form input
  price: string; // String for form input
  is_eighteen_plus: boolean;
  image?: File | null;
  benefits?: IDealBenefitFormData[];
  agendas?: IDealAgendaFormData[];
}

export interface IDealBenefitFormData {
  id?: string;
  description: string;
}

export interface IDealAgendaFormData {
  id?: string;
  title: string;
}

// ==================================
// Utility Types
// ==================================

export type DealStatus = "upcoming" | "ongoing" | "completed" | "expired";

export interface IDealWithStatus extends IDeal {
  status: DealStatus;
  daysUntilDeal?: number;
}

export interface IDealStats {
  totalDeals: number;
  upcomingDeals: number;
  ongoingDeals: number;
  completedDeals: number;
  expiredDeals: number;
}

// ==================================
// Component Props Types
// ==================================

export interface IDealCardProps {
  deal: IDealListItem;
  onView?: (dealId: string) => void;
  onEdit?: (dealId: string) => void;
  onDelete?: (dealId: string) => void;
  showActions?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export interface IDealListProps {
  deals: IDealListItem[];
  loading?: boolean;
  error?: string;
  onDealClick?: (dealId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
}

export interface IDealFormProps {
  initialData?: IDeal;
  onSubmit: (data: ICreateDealDto | IUpdateDealDto) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: "create" | "edit";
}
