import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IAccommodationAgreement,
  IAgreementTerm,
  IBusinessAgreement,
} from "@/types/agreement-types";

interface ContractViewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  agreement: IBusinessAgreement | IAccommodationAgreement | null;
  terms: IAgreementTerm[];
}

export function ContractViewModal({
  open,
  onClose,
  title,
  agreement,
  terms,
}: ContractViewModalProps) {
  const isAccommodation = agreement && "property_name" in agreement;
  const signedDate = agreement
    ? isAccommodation
      ? agreement.created_at
      : agreement.agreement_date
    : "";
  const createdDate = agreement?.created_at ?? "";
  const updatedDate = agreement?.updated_at ?? "";
  const completedDate = agreement?.completed_at ?? "";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {agreement ? (
          <div className="space-y-6 p-6 bg-white">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <div className="bg-gray-800 text-white p-4 rounded mb-4">
                <h1 className="text-xl font-bold">
                  MyPal Hospitality Innovation Services
                </h1>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                This agreement is entered into between
              </p>
              <p className="font-semibold">
                MyPal Hospitality Innovation Services, located at 18B Zainab
                Street, Medina Estate, Gbagada, Lagos, and you. The{" "}
                {isAccommodation ? "Accommodation" : "Business"}:
              </p>
            </div>

            {/* Property/Business Details */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <span className="font-semibold">Property</span>
              </div>

              {isAccommodation ? (
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-medium w-40">Name:</span>
                    <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                      {(agreement as IAccommodationAgreement).property_name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-40">
                      Company name (Registered business name):
                    </span>
                    <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                      {(agreement as IAccommodationAgreement).company_name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-40">Situated at:</span>
                    <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                      {(agreement as IAccommodationAgreement).situated_at}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-medium w-40">Company Name:</span>
                    <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                      {(agreement as IBusinessAgreement).company_name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-40">Business Name:</span>
                    <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                      {(agreement as IBusinessAgreement).business_name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-40">Address:</span>
                    <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                      {(agreement as IBusinessAgreement).address}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Agreement Dates */}
            <div className="space-y-2">
              <div className="border-b pb-2">
                <span className="font-semibold">Agreement Dates</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium">Created</span>
                  <span className="border-b border-dotted border-gray-400 block min-h-[1.5rem]">
                    {createdDate ? new Date(createdDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">Updated</span>
                  <span className="border-b border-dotted border-gray-400 block min-h-[1.5rem]">
                    {updatedDate ? new Date(updatedDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">Completed</span>
                  <span className="border-b border-dotted border-gray-400 block min-h-[1.5rem]">
                    {completedDate ? new Date(completedDate).toLocaleDateString() : "Not completed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Agreement Terms */}
            {terms.length > 0 && (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <span className="font-semibold">
                    Agreement Terms and Conditions:
                  </span>
                </div>

                {terms.map((term, index) => (
                  <div key={term.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-semibold mb-2">
                      {index + 1}. {term.title}
                    </h3>
                    <div className="text-sm whitespace-pre-wrap">
                      {term.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Commission Rates */}
            <div className="space-y-2">
              <p className="font-semibold">Commission Rates:</p>
              <div className="flex items-center space-x-4 text-sm">
                <span>10%</span>
                <span>15%</span>
                <span>20%</span>
                <span className="font-semibold">
                  {isAccommodation
                    ? `${
                        (agreement as IAccommodationAgreement)
                          .percentage_discount
                      }%`
                    : `${
                        (agreement as IBusinessAgreement).percentage_discount
                      }%`}{" "}
                  ✓
                </span>
                <span>30%</span>
                <span>40%</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="space-y-6 mt-8">
              <div className="text-center">
                <p className="font-semibold">
                  SIGNED & SEALED BY THE PARTIES ON THE _________ DAY OF
                  ____________YEAR_____________
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* MyPal Side */}
                <div className="space-y-4">
                  <p className="font-semibold text-center">For: MyPal</p>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="font-medium w-20">NAME:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).mypal
                              ?.name || ""
                          : "MyPal Representative"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Designation:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).mypal
                              ?.designation || ""
                          : "Business Development"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Signature:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).mypal
                              ?.signature || ""
                          : ""}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Phone:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).mypal
                              ?.phone || ""
                          : ""}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Email:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).mypal
                              ?.email || ""
                          : ""}
                      </span>
                    </div>
                    {/* add completed date */}
                      <div className="flex">
                        <span className="font-medium w-20">Date:</span>
                        <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                          {signedDate
                            ? new Date(signedDate).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                  </div>
                  {isAccommodation && (
                    <div className="mt-4">
                      <p className="font-medium">In presence of</p>
                      <div className="flex mt-2">
                        <span className="font-medium w-20">Signature:</span>
                        <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                          {(agreement as IAccommodationAgreement).mypal
                            ?.witness_signature || ""}
                        </span>
                      </div>
                      <div className="flex mt-2">
                        <span className="font-medium w-20">Name:</span>
                        <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                          {(agreement as IAccommodationAgreement).mypal
                            ?.witness_name || ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Business/Accommodation Side */}
                <div className="space-y-4">
                  <p className="font-semibold text-center">
                    {isAccommodation ? "Accommodation Name:" : "Business Name:"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="font-medium w-20">NAME:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).accomodation
                              ?.name || ""
                          : (agreement as IBusinessAgreement)
                              .representative_name || ""}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Designation:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).accomodation
                              ?.designation || ""
                          : (agreement as IBusinessAgreement)
                              .representative_title || ""}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Signature:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).accomodation
                              ?.signature || ""
                          : (agreement as IBusinessAgreement).e_signature || ""}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Phone:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).accomodation
                              ?.phone || ""
                          : ""}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-20">Email:</span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                        {isAccommodation
                          ? (agreement as IAccommodationAgreement).accomodation
                              ?.email || ""
                          : (agreement as IBusinessAgreement).business_email ||
                            ""}
                      </span>
                    </div>
                  </div>
                  {isAccommodation && (
                    <div className="mt-4">
                      <p className="font-medium">In presence of</p>
                      <div className="flex mt-2">
                        <span className="font-medium w-20">Signature:</span>
                        <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                          {(agreement as IAccommodationAgreement).accomodation
                            ?.witness_signature || ""}
                        </span>
                      </div>
                      <div className="flex mt-2">
                        <span className="font-medium w-20">Name:</span>
                        <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem]">
                          {(agreement as IAccommodationAgreement).accomodation
                            ?.witness_name || ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {isAccommodation &&
                (agreement as IAccommodationAgreement).commission_contact && (
                  <div className="text-center mt-6">
                    <div className="flex justify-center">
                      <span className="font-medium w-40">
                        Contact for commissions (Phone & Email):
                      </span>
                      <span className="border-b border-dotted border-gray-400 flex-1 min-h-[1.5rem] max-w-md">
                        {
                          (agreement as IAccommodationAgreement)
                            .commission_contact
                        }
                      </span>
                    </div>
                  </div>
                )}

              {/* Submit Button */}
              {!agreement.is_accepted && (
                <div className="text-center mt-8">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                    Submit agreement
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-blue-900 to-orange-600 text-white p-4 rounded text-center mt-8">
              <div className="space-y-2">
                <p className="font-semibold">MyPal Hospitality</p>
                <p className="text-sm">Bookings and reservation</p>
                <p className="text-sm">
                  18B, Zainab Street, Medina Estate, Gbagada, Lagos
                </p>
                <p className="text-sm">info@mypal-inc.com</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <span>No agreement data available</span>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => window.print()}>
            Print Contract
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
