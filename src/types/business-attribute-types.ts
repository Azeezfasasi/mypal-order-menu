export interface AddIconicDelicacyAttractionDTO {
    label: string
}
export interface AddBuffetAttractionDTO {
    label: string
}

export interface Attribute {
  id: string;
  label: string;
  image_url: string | null;
  attraction_type: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}