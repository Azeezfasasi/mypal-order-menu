import { IBusiness } from "@/types/auth-types";
import { create } from "zustand";
import { IStoredBusiness } from "./auth-store";

export type BusinessType = "Unregistered" | "Registered" | "Incorporated";

export interface BusinessProfile {
  business_name: string;
  business_number: string;
  tax_identification_number: string;
  description: string;
  address: string;
  longitude?: number;
  latitude?: number;
  category?: string;
  business_type: BusinessType;
  business_start_date: string;
}

export interface BankingDetails {
  business_bank_name: string;
  bank_code: string;
  business_acc_name: string;
  business_acc_number: string;
}

export interface BusinessDocuments {
  image?: File;
  cac_document?: File;
  memat?: File;
  director_identity?: File;
  directors_address: string;
  shareholders_address: string;
}

interface KybStore {
  businessProfile: BusinessProfile;
  bankingDetails: BankingDetails;
  businessDocuments: BusinessDocuments;
  // preview URLs for documents when files are not available as File objects
  businessDocumentsPreviewUrls: {
    image?: string | null;
    cac_document?: string | null;
    memat?: string | null;
    director_identity?: string | null;
  };
  // list of fields the verification team requested updates for
  requiredUpdates?: string[] | null;
  // ownerBusinessId ties the in-memory draft to a specific business/account
  ownerBusinessId?: string | null;
  updateBusinessProfile: (data: Partial<BusinessProfile>) => void;
  updateBankingDetails: (data: Partial<BankingDetails>) => void;
  updateBusinessDocuments: (data: Partial<BusinessDocuments>) => void;
  setBusinessDocumentsPreviews: (previews: {
    image?: string | null;
    cac_document?: string | null;
    memat?: string | null;
    director_identity?: string | null;
  }) => void;
  setRequiredUpdates: (fields: string[] | null) => void;
  // apply prefill from a business object (sets profile, banking, previews, owner id)
  // Accept either full `IBusiness` or the stored/minimal `IStoredBusiness` shape
  applyPrefillFromBusiness: (
    business: IBusiness | IStoredBusiness,
    requiredFields?: string[] | null,
  ) => void;
  resetForm: () => void;
  setOwnerBusinessId: (id: string | null) => void;
  getUpdatePayload: () => Partial<BusinessDocuments>;
}

export const useKybStore = create<KybStore>((set, get) => ({
  businessProfile: {
    business_name: "",
    business_number: "",
    tax_identification_number: "",
    description: "",
    address: "",
    longitude: undefined,
    latitude: undefined,
    category: "",
    business_type: "Registered",
    business_start_date: "",
  },
  bankingDetails: {
    business_bank_name: "",
    bank_code: "",
    business_acc_name: "",
    business_acc_number: "",
  },
  businessDocuments: {
    image: undefined,
    cac_document: undefined,
    memat: undefined,
    director_identity: undefined,
    directors_address: "",
    shareholders_address: "",
  },
  businessDocumentsPreviewUrls: {
    image: null,
    cac_document: null,
    memat: null,
    director_identity: null,
  },
  requiredUpdates: null,
  // initially no owner assigned
  ownerBusinessId: null,

  updateBusinessProfile: (data) =>
    set((state) => ({
      businessProfile: { ...state.businessProfile, ...data },
    })),
  updateBankingDetails: (data) =>
    set((state) => ({
      bankingDetails: { ...state.bankingDetails, ...data },
    })),
  updateBusinessDocuments: (data) =>
    set((state) => ({
      businessDocuments: { ...state.businessDocuments, ...data },
    })),
  setBusinessDocumentsPreviews: (previews) =>
    set((state) => ({
      businessDocumentsPreviewUrls: {
        ...state.businessDocumentsPreviewUrls,
        ...previews,
      },
    })),
  setRequiredUpdates: (fields) => set({ requiredUpdates: fields }),
  applyPrefillFromBusiness: (business, requiredFields) =>
    set((state) => ({
      businessProfile: {
        ...state.businessProfile,
        business_name:
          business.business_name || state.businessProfile.business_name,
        business_number:
          business.business_number || state.businessProfile.business_number,
        tax_identification_number:
          business.tax_identification_number ||
          state.businessProfile.tax_identification_number,
        description: business.description || state.businessProfile.description,
        address: business.address || state.businessProfile.address,
        longitude: business.long
          ? Number(business.long)
          : state.businessProfile.longitude,
        latitude: business.lat
          ? Number(business.lat)
          : state.businessProfile.latitude,
        category: business.category?.business_type || state.businessProfile.category,
        business_type:
          (business.business_type as BusinessType) ||
          state.businessProfile.business_type,
        business_start_date:
          business.business_start_date ||
          state.businessProfile.business_start_date,
      },
      bankingDetails: {
        ...state.bankingDetails,
        business_bank_name:
          business.business_bank_name ||
          state.bankingDetails.business_bank_name,
        bank_code: state.bankingDetails.bank_code,
        business_acc_name:
          business.business_acc_name || state.bankingDetails.business_acc_name,
        business_acc_number:
          business.business_acc_number ||
          state.bankingDetails.business_acc_number,
      },
      businessDocumentsPreviewUrls: {
        image: business.image_url || state.businessDocumentsPreviewUrls.image,
        cac_document:
          business.cac_document ||
          state.businessDocumentsPreviewUrls.cac_document,
        memat: business.memat || state.businessDocumentsPreviewUrls.memat,
        director_identity:
          business.director_identity ||
          state.businessDocumentsPreviewUrls.director_identity,
      },
      ownerBusinessId: business.id,
      requiredUpdates: requiredFields ?? state.requiredUpdates,
    })),
  resetForm: () =>
    set({
      businessProfile: {
        business_name: "",
        business_number: "",
        tax_identification_number: "",
        description: "",
        address: "",
        longitude: undefined,
        latitude: undefined,
        category: "",
        business_type: "Unregistered",
        business_start_date: "",
      },
      bankingDetails: {
        business_bank_name: "",
        bank_code: "",
        business_acc_name: "",
        business_acc_number: "",
      },
      businessDocuments: {
        image: undefined,
        cac_document: undefined,
        memat: undefined,
        director_identity: undefined,
        directors_address: "",
        shareholders_address: "",
      },
      // clear owner when resetting
      ownerBusinessId: null,
    }),
  setOwnerBusinessId: (id: string | null) => set({ ownerBusinessId: id }),
  getUpdatePayload: () => {
    const { businessProfile, bankingDetails, businessDocuments } = get();

    const combined = {
      ...businessProfile,
      ...bankingDetails,
      ...businessDocuments,
    };

    // Filter out empty, undefined, or null values
    return Object.fromEntries(
      Object.entries(combined).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, value]) =>
          value !== "" &&
          value !== undefined &&
          value !== null &&
          !(
            typeof value === "object" &&
            value instanceof File === false &&
            Object.keys(value).length === 0
          ),
      ),
    );
  },
}));
