// src/types/transaction-types.ts

import { IBusiness } from "./auth-types";

export enum TransactionInformationType {
  VAT = "VAT",
  SERVICE_CHARGE = "SERVICE CHARGE",
  DISCOUNT = "DISCOUNT",
  STATE_TAX = "STATE TAX",
}

// Map enum display values to backend format (replaces spaces with underscores)
export const mapChargeTypeToBackend = (
  chargeType: TransactionInformationType
): string => {
  return chargeType.replace(/\s+/g, "_");
};

export interface ITransactionInformation {
  id: string;
  percentage: number;
  type: TransactionInformationType;
  isActive: boolean;
  isInclusive?: boolean; // For VAT/TAX: true = inclusive, false = exclusive
  user_percentage: number;
  admin_percentage: number;
  business?: IBusiness;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CreateTransactionInformationDto {
  type: TransactionInformationType;
}

export interface UpdateBusinessTransactionInformationDto {
  isActive: boolean;
}

export interface CreateDiscountDto {
  percentage: number;
}

export interface UpdateDiscountDto {
  percentage: number;
}

export interface UpdateUserDiscountDto {
  businessId: string;
  user_percentage: number;
}

export interface SelectChargeDto {
  chargeId: string;
}

// For the calculateCharges result
export interface ChargeBreakdown {
  baseAmount: number;
  charges: {
    type: string;
    percentage: number;
    amount: number;
  }[];
  totalAmount: number;
}
