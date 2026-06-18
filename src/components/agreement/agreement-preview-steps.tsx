// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   IAccommodationAgreement,
//   IAgreementTerm,
// } from "@/types/agreement-types";
// import { useState } from "react";

// import { Steps } from "../ui/steps";
// import { ContractViewModal } from "./contract-view-modal";

// interface AgreementPreviewStepsProps {
//   agreement: IAccommodationAgreement | null;
//   terms: IAgreementTerm[];
//   onAccept: () => void;
//   onUpdate: (data: any) => void;
//   isSubmitting?: boolean;
// }

// export function AgreementPreviewSteps({
//   agreement,
//   terms,
//   onAccept,
// //   onUpdate,
//   isSubmitting,
// }: AgreementPreviewStepsProps) {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);

//   // Calculate completion status
//   const hasBasicInfo = agreement?.property_name && agreement?.company_name;
//   const hasLocation = agreement?.situated_at;
//   const hasRepresentative =
//     agreement?.accomodation?.name &&
//     agreement?.accomodation?.designation &&
//     agreement?.accomodation?.signature;
//   const hasWitness =
//     agreement?.accomodation?.witness_name &&
//     agreement?.accomodation?.witness_signature;

//   const steps = [
//     {
//       title: "Basic Information",
//       description: "Property and company details",
//       isCompleted: !!hasBasicInfo,
//     },
//     {
//       title: "Location",
//       description: "Property location and contact details",
//       isCompleted: !!hasLocation,
//     },
//     {
//       title: "Representative Details",
//       description: "Authorized representative information",
//       isCompleted: !!hasRepresentative,
//     },
//     {
//       title: "Witness Information",
//       description: "Witness details and signature",
//       isCompleted: !!hasWitness,
//     },
//   ];

//   return (
//     <div className="space-y-8">
//       {/* Progress Steps */}
//       <Steps
//         steps={steps}
//         currentStep={currentStep}
//         onStepClick={setCurrentStep}
//       />

//       {/* Current Section Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>{steps[currentStep - 1].title}</CardTitle>
//           <CardDescription>
//             {steps[currentStep - 1].description}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {/* Preview of current section's data */}
//           <div className="space-y-4">
//             {currentStep === 1 && (
//               <>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium">Property Name</label>
//                     <p className="mt-1">
//                       {agreement?.property_name || "Not set"}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium">Company Name</label>
//                     <p className="mt-1">
//                       {agreement?.company_name || "Not set"}
//                     </p>
//                   </div>
//                 </div>
//               </>
//             )}
//             {currentStep === 2 && (
//               <div>
//                 <label className="text-sm font-medium">Property Location</label>
//                 <p className="mt-1">{agreement?.situated_at || "Not set"}</p>
//               </div>
//             )}
//             {currentStep === 3 && (
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm font-medium">
//                     Representative Name
//                   </label>
//                   <p className="mt-1">
//                     {agreement?.accomodation?.name || "Not set"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Designation</label>
//                   <p className="mt-1">
//                     {agreement?.accomodation?.designation || "Not set"}
//                   </p>
//                 </div>
//               </div>
//             )}
//             {currentStep === 4 && (
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm font-medium">Witness Name</label>
//                   <p className="mt-1">
//                     {agreement?.accomodation?.witness_name || "Not set"}
//                   </p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">
//                     Witness Signature
//                   </label>
//                   <p className="mt-1">
//                     {agreement?.accomodation?.witness_signature || "Not set"}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </CardContent>
//         <CardFooter className="flex justify-between">
//           <Button
//             variant="outline"
//             onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
//             disabled={currentStep === 1}
//           >
//             Previous
//           </Button>
//           <div className="flex gap-2">
//             <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
//               Preview Full Agreement
//             </Button>
//             <Button
//               onClick={() => {
//                 if (currentStep < steps.length) {
//                   setCurrentStep((prev) => prev + 1);
//                 } else {
//                   onAccept();
//                 }
//               }}
//               disabled={isSubmitting}
//             >
//               {currentStep === steps.length ? "Accept Agreement" : "Next"}
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>

//       {/* Terms Summary */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Agreement Terms</CardTitle>
//           <CardDescription>Key points of the agreement</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {terms.map((term, index) => (
//               <div key={term.id} className="border-b pb-4 last:border-b-0">
//                 <h4 className="font-medium">
//                   {index + 1}. {term.title}
//                 </h4>
//                 {Array.isArray(term.content) ? (
//                   <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
//                     {term.content.map((desc, i) => (
//                       <li key={i}>{desc}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="mt-2 text-sm text-gray-600">{term.content}</p>
//                 )}
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Full Agreement Preview Modal */}
//       <ContractViewModal
//         open={isPreviewOpen}
//         onClose={() => setIsPreviewOpen(false)}
//         title="Agreement Preview"
//         agreement={agreement}
//         terms={terms}
//       />
//     </div>
//   );
// }
