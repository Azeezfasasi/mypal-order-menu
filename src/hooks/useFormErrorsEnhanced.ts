import { useEffect } from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";

/**
 * Hook to handle form errors including auto-scrolling to the first error
 * @param form The form object returned by useForm or useFormWithValidation
 * @param options Configuration options for error handling
 * @returns Error information and helper methods
 */
export function useFormErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: {
    scrollToError?: boolean;
    scrollOptions?: ScrollIntoViewOptions;
  } = {
    scrollToError: true,
    scrollOptions: { behavior: "smooth", block: "center" },
  },
) {
  const { formState } = form;
  const { errors, isSubmitted } = formState;

  // Automatically scroll to the first error after submission
  useEffect(() => {
    if (
      options.scrollToError &&
      isSubmitted &&
      Object.keys(errors).length > 0
    ) {
      // Short timeout to ensure DOM has updated
      setTimeout(() => {
        // Find the first element with an error
        const firstErrorField = Object.keys(errors)[0] as string;
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"], #${firstErrorField}, [id="${firstErrorField}"]`,
        );

        if (errorElement) {
          // Scroll the element into view
          errorElement.scrollIntoView(options.scrollOptions);

          // Optionally focus the element
          if (errorElement instanceof HTMLElement) {
            errorElement.focus();
          }
        }
      }, 100);
    }
  }, [errors, isSubmitted, options.scrollToError, options.scrollOptions]);

  // Helper to check if a specific field has errors
  const hasError = (fieldName: Path<T>) => {
    return Boolean(errors[fieldName]);
  };

  // Helper to get error message for a field
  const getErrorMessage = (fieldName: Path<T>): string | undefined => {
    const error = errors[fieldName];
    return error?.message as string | undefined;
  };

  return {
    errors,
    hasErrors: Object.keys(errors).length > 0,
    hasError,
    getErrorMessage,
    isSubmitted,
  };
}

//EXAMPLE USAGE

// "use client";

// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
// import { useFormWithValidation } from "@/hooks/useFormWithValidation";
// import { useFormErrors } from "@/hooks/useFormErrorsEnhanced";
// import { useState } from "react";

// // Define your form schema with Zod
// const productSchema = z.object({
//   name: z.string().min(3, "Product name must be at least 3 characters"),
//   price: z.string().refine(
//     (val) => !isNaN(Number(val)) && Number(val) > 0,
//     { message: "Price must be a positive number" }
//   ),
//   description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description is too long"),
//   category: z.string().min(1, "Please select a category"),
// });

// // Infer the type from the schema
// type ProductFormValues = z.infer<typeof productSchema>;

// // Default values for the form
// const defaultValues: ProductFormValues = {
//   name: "",
//   price: "",
//   description: "",
//   category: "",
// };

// export function ProductForm() {
//   const [isSuccess, setIsSuccess] = useState(false);

//   // Handler for form submission
//   const onSubmitHandler = async (data: ProductFormValues) => {
//     console.log("Submitting product:", data);

//     // Simulate API call
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     // Show success message
//     setIsSuccess(true);
//     setTimeout(() => setIsSuccess(false), 3000);

//     // Reset form after successful submission
//     form.reset();
//   };

//   // Use our custom hooks
//   const { form, onSubmit, isSubmitting } = useFormWithValidation({
//     schema: productSchema,
//     defaultValues,
//     onSubmitHandler,
//   });

//   const { hasError, getErrorMessage } = useFormErrors(form);

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardHeader>
//         <CardTitle>Add New Product</CardTitle>
//       </CardHeader>

//       <form onSubmit={onSubmit}>
//         <CardContent className="space-y-4">
//           {isSuccess && (
//             <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
//               Product successfully added!
//             </div>
//           )}

//           <div className="space-y-2">
//             <label htmlFor="name" className="text-sm font-medium">
//               Product Name
//             </label>
//             <Input
//               id="name"
//               {...form.register("name")}
//               placeholder="Enter product name"
//             />
//             {hasError("name") && (
//               <p className="text-red-500 text-sm mt-1">
//                 {getErrorMessage("name")}
//               </p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="price" className="text-sm font-medium">
//               Price
//             </label>
//             <Input
//               id="price"
//               {...form.register("price")}
//               placeholder="0.00"
//             />
//             {hasError("price") && (
//               <p className="text-red-500 text-sm mt-1">
//                 {getErrorMessage("price")}
//               </p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="category" className="text-sm font-medium">
//               Category
//             </label>
//             <select
//               id="category"
//               className="w-full p-2 border rounded-md"
//               {...form.register("category")}
//             >
//               <option value="">Select a category</option>
//               <option value="electronics">Electronics</option>
//               <option value="clothing">Clothing</option>
//               <option value="food">Food</option>
//             </select>
//             {hasError("category") && (
//               <p className="text-red-500 text-sm mt-1">
//                 {getErrorMessage("category")}
//               </p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="description" className="text-sm font-medium">
//               Description
//             </label>
//             <Textarea
//               id="description"
//               {...form.register("description")}
//               placeholder="Product description"
//               rows={4}
//             />
//             {hasError("description") && (
//               <p className="text-red-500 text-sm mt-1">
//                 {getErrorMessage("description")}
//               </p>
//             )}
//           </div>
//         </CardContent>

//         <CardFooter>
//           <Button
//             type="submit"
//             className="w-full"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? "Saving..." : "Add Product"}
//           </Button>
//         </CardFooter>
//       </form>
//     </Card>
//   );
// }
