import { useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

export const useFormErrors = <T extends FieldValues>(
  form: UseFormReturn<T>,
) => {
  const {
    formState: { errors },
    clearErrors,
    watch,
  } = form;

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && errors[name]) {
        clearErrors(name);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors, errors]);

  // return {
  //   hasErrors: Object.keys(formState.errors).length > 0,
  //   errors: formState.errors,
  // };

  return errors;
};
