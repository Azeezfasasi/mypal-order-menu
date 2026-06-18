import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import {
  DefaultValues,
  FieldValues,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

interface FormValidationConfig<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  onSubmitHandler?: (data: T) => Promise<void>;
}

interface FormValidationReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (data: T) => Promise<void>;
  resetServerError: () => void;
}

/**
 * Generic form validation hook that works with any Zod schema
 * @param config Configuration object containing schema, default values, and optional submit handler
 * @returns Form utilities including react-hook-form instance, submission state, and error handling
 */
export const useFormWithValidation = <T extends FieldValues>(
  config: FormValidationConfig<T>,
): FormValidationReturn<T> => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues,
    mode: "onBlur",
  });

  const resetServerError = useCallback(() => {
    setServerError(null);
  }, []);

  const onSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setServerError(null);

      try {
        if (config.onSubmitHandler) {
          await config.onSubmitHandler(data);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setServerError(errorMessage);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [config],
  );

  return {
    form,
    isSubmitting,
    serverError,
    onSubmit,
    resetServerError,
  };
};

// Example usage:

// 1. Define your schema
// const loginSchema = z.object({
//     email: z.string().email('Invalid email'),
//     password: z.string().min(8, 'Password too short'),
//     rememberMe: z.boolean().optional(),
//   })

//   // 2. Infer the type from the schema
//   type LoginFormData = z.infer<typeof loginSchema>

//   // 3. Create default values that match the schema
//   const defaultLoginValues: LoginFormData = {
//     email: '',
//     password: '',
//     rememberMe: false,
//   }

//   // 4. Example API function
//   const loginApi = async (data: LoginFormData) => {
//     // Simulated API call
//     return new Promise<void>((resolve, reject) => {
//       setTimeout(() => {
//         if (data.email === 'test@example.com') {
//           resolve()
//         } else {
//           reject(new Error('Invalid credentials'))
//         }
//       }, 1000)
//     })
//   }

//   // 5. Example usage in a component
//   const LoginForm = () => {
//     const { form, isSubmitting, serverError, onSubmit } = useFormWithValidation({
//       schema: loginSchema,
//       defaultValues: defaultLoginValues,
//       onSubmitHandler: loginApi,
//     })

//     return <form>{/* Form fields here */}</form>
//   }

//   // Example with a more complex schema
//   const registrationSchema = z.object({
//     username: z.string().min(3),
//     email: z.string().email(),
//     password: z.string().min(8),
//     confirmPassword: z.string(),
//     profile: z.object({
//       firstName: z.string(),
//       lastName: z.string(),
//       age: z.number().min(18),
//     }),
//     preferences: z.array(z.string()),
//   }).refine(data => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ['confirmPassword'],
//   })

//   type RegistrationFormData = z.infer<typeof registrationSchema>

//   const defaultRegistrationValues: RegistrationFormData = {
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     profile: {
//       firstName: '',
//       lastName: '',
//       age: 18,
//     },
//     preferences: [],
//   }

//   // Example component with nested form data
//   const RegistrationForm = () => {
//     const { form, isSubmitting, serverError, onSubmit } = useFormWithValidation({
//       schema: registrationSchema,
//       defaultValues: defaultRegistrationValues,
//       onSubmitHandler: async (data) => {
//         // Handle registration
//         console.log(data)
//       },
//     })

//     return <form>{/* Form fields here */}</form>
//   }

//   // Example with custom error handling
//   const CustomForm = () => {
//     const { form, isSubmitting, serverError, onSubmit, resetServerError } =
//       useFormWithValidation({
//         schema: loginSchema,
//         defaultValues: defaultLoginValues,
//         onSubmitHandler: async (data) => {
//           try {
//             await loginApi(data)
//           } catch (error) {
//             // Custom error handling
//             if (error instanceof Error) {
//               throw new Error(`Authentication failed: ${error.message}`)
//             }
//             throw error
//           }
//         },
//       })

//     // Reset server error on form change
//     useEffect(() => {
//       const subscription = form.watch(() => {
//         if (serverError) {
//           resetServerError()
//         }
//       })
//       return () => subscription.unsubscribe()
//     }, [form, serverError, resetServerError])

//     return <form>{/* Form fields here */}</form>
