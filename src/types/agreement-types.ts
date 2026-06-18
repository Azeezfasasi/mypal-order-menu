// Agreement types for business and accommodation agreements

import { IAdmin, IBusiness } from "./auth-types";

// Party Details
export interface IPartyDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Agreement Terms
export interface IAgreementTerm {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  preamble?: string;
  description: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAgreementTermDto {
  title: string;
  content: string;
  isActive?: boolean;
}

export interface IUpdateAgreementTermDto {
  title?: string;
  content?: string;
  isActive?: boolean;
}

// ========== BUSINESS AGREEMENT TYPES ==========
export interface IBusinessAgreement {
  id: string;
  company_name: string;
  address: string;
  percentage_discount: number;
  business_name: string;
  representative_name: string;
  representative_title: string;
  business_email: string;
  e_signature: string;
  agreement_date: string; // ISO string
  is_accepted: boolean;
  business: IBusiness;
  admin?: IAdmin;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  deleted_at?: string;
}

export interface ICreateBusinessAgreementDto {
  company_name: string;
  address: string;
  percentage_discount: number;
  business_name: string;
  representative_name: string;
  representative_title: string;
  business_email: string;
  e_signature: string;
  agreement_date: string; // ISO string
  business_id: string;
}

export interface IUpdateBusinessAgreementDto {
  company_name?: string;
  address?: string;
  business_name?: string;
  representative_name?: string;
  representative_title?: string;
  business_email?: string;
  e_signature?: string;
  is_accepted?: boolean;
}

// ========== ACCOMMODATION AGREEMENT TYPES ==========
export interface IPartyDetails {
  name: string;
  designation: string;
  signature: string;
  phone: string;
  email: string;
  witness_name: string;
  witness_signature: string;
}

export interface IAccommodationAgreement {
  id: string;
  property_name: string;
  mypal: IPartyDetails;
  accomodation: IPartyDetails;
  business: IBusiness;
  admin?: IAdmin;
  company_name: string;
  situated_at: string;
  percentage_discount: number;
  commission_contact?: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  deleted_at?: string;
}

export interface ICreateAccommodationAgreementDto {
  mypal: IPartyDetails;
  percentage_discount: number;
  business_id: string;
}

export interface IUpdateAccommodationAgreementDto {
  accomodation: IPartyDetails;
  property_name: string;
  company_name: string;
  situated_at: string;
  commission_contact?: string;
  is_accepted?: boolean;
}
