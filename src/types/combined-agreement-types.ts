import {
  IAccommodationAgreement,
  IAgreementTerm,
  IBusinessAgreement,
} from "./agreement-types";

export interface ICombinedBusinessAgreement {
  agreement: IBusinessAgreement;
  terms: IAgreementTerm[];
}

export interface ICombinedAccommodationAgreement {
  agreement: {
    status: string;
    statusCode: number;
    message: string;
    data: IAccommodationAgreement;
  };
  terms: {
    status: string;
    statusCode: number;
    message: string;
    data: IAgreementTerm[];
  };
}

export interface ICombinedAgreements {
  business: ICombinedBusinessAgreement;
  accommodation: ICombinedAccommodationAgreement;
}
