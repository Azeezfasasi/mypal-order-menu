// Types for business contracts

export interface IBusinessContract {
  id: string;
  status: "pending" | "processing" | "approved" | string;
  business_name: string;
  business_business_name?: string;
  business_business_address?: string;
  business_designation?: string;
  business_signature?: string;
  business_phone?: string;
  business_email?: string;
  business_witness_signature?: string;
  business_witness_phone?: string;
  business_witness_email?: string;

  mipal_name: string | null;
  mipal_designation: string | null;
  mipal_signature: string | null;
  mipal_phone: string | null;
  mipal_email: string | null;
  mipal_witness_signature: string | null;
  completed_at?: string | null;

  commission_value?: string;
  commission_model?: string;
  markup_percentage?: number | null;
  discount_percentage?: number | null;

  // Additional fields from backend
  contract_content?: string;
  template_title?: string;
  business_category?: string;

  created_at: string;
  updated_at: string;
}

export interface ICreateOrUpdateBusinessContractDto {
  business_name: string;
  business_designation?: string;
  business_signature?: string;
  business_phone?: string;
  business_email?: string;
  business_witness_signature?: string;
  business_witness_phone?: string;
  business_witness_email?: string;
}

export type IGetBusinessContractResponse = {
  status: string;
  statusCode: number;
  message: string;
  data: IBusinessContract;
};

// Contract Template Types
export interface IContractTemplateCategory {
  id: string;
  name: string;
  business_type: string;
}

export interface IContractTemplate {
  id: string;
  category: IContractTemplateCategory;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type IGetContractTemplateResponse = {
  status: string;
  statusCode: number;
  message: string;
  data: IContractTemplate;
};
