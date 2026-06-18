"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { cn } from "@/lib/utils"; // Utility function for merging classNames
import { Loader2, Upload } from "lucide-react"; // Import for loading indicator and upload icon

export type Option = {
  label: string;
  value: string;
};

export type OptionGroup = {
  label: string;
  options: Option[];
};

export type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  onChange?: (value: unknown) => void;
};

export type InputFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
  type?:
    | "text"
    | "email"
    | "password"
    | "date"
    | "number"
    | "color"
    | "file"
    | "tel";
} & React.ComponentPropsWithoutRef<"input">;

export type TextareaFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
  type: "textarea";
} & React.ComponentPropsWithoutRef<"textarea">;

export type SelectFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
  type: "select";
  options: Option[] | OptionGroup[];
  isGrouped?: boolean;
  convertToNumber?: boolean;
} & React.ComponentPropsWithoutRef<"select">;

export type FileInputFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
  type: "file";
  accept?: string;
  multiple?: boolean;
} & React.ComponentPropsWithoutRef<"input">;

export type CustomInputFieldProps<T extends FieldValues> =
  | InputFieldProps<T>
  | TextareaFieldProps<T>
  | SelectFieldProps<T>
  | FileInputFieldProps<T>;

export function CustomInputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  className,
  readOnly,
  isLoading,
  onChange,
  ...props
}: CustomInputFieldProps<T> & {
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const defaultClassname =
    "p-5 text-sm font-light text-gray-700 placeholder:text-gray-400";

  return (
    <FormField
      control={control}
      name={name}
      render={({
        field: { ref, onChange: fieldOnChange, value, ...fieldProps },
      }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {props.type === "textarea" ? (
              <Textarea
                ref={ref}
                {...fieldProps}
                onChange={(e) => {
                  fieldOnChange(e);
                  onChange?.(e.target.value);
                }}
                value={value ?? ""}
                {...props}
                className={cn(defaultClassname, className)}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={props.disabled || isLoading}
              />
            ) : props.type === "select" ? (
              <Select
                {...fieldProps}
                onValueChange={(newValue) => {
                  // Conditionally convert the value if required
                  const processedValue = props.convertToNumber
                    ? Number(newValue)
                    : newValue;
                  fieldOnChange(processedValue);
                  onChange?.(processedValue);
                }}
                value={String(value ?? "")}
                disabled={props.disabled || readOnly || isLoading}
              >
                <SelectTrigger className={cn(defaultClassname, className)}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder={placeholder} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {(props as SelectFieldProps<T>).isGrouped
                    ? (
                        (props as SelectFieldProps<T>).options as OptionGroup[]
                      ).map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))
                    : ((props as SelectFieldProps<T>).options as Option[]).map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        )
                      )}
                </SelectContent>
              </Select>
            ) : props.type === "file" ? (
              <div className="relative">
                <Input
                  ref={ref}
                  {...fieldProps}
                  type="file"
                  accept={(props as FileInputFieldProps<T>).accept}
                  multiple={(props as FileInputFieldProps<T>).multiple}
                  className={cn(
                    "absolute inset-0 z-10 m-0 h-full w-full cursor-pointer p-0 opacity-0",
                    className
                  )}
                  disabled={props.disabled || readOnly || isLoading}
                  onChange={(e) => {
                    const files = e.target.files;
                    fieldOnChange(files);
                    onChange?.(files);
                  }}
                  {...props}
                />
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-4",
                    "text-sm font-light text-gray-500 transition-colors hover:bg-gray-50",
                    className
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>
                        {value && (value as FileList)?.length > 0
                          ? Array.from(value as FileList)
                              .map((file) => file.name)
                              .join(", ")
                          : placeholder || "Click to upload"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Input
                ref={ref}
                {...fieldProps}
                onChange={(e) => {
                  fieldOnChange(e);
                  onChange?.(e.target.value);
                }}
                value={value ?? ""}
                {...props}
                type={props.type}
                className={cn(defaultClassname, className)}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={props.disabled || isLoading}
              />
            )}
          </FormControl>
          {description && (
            <FormDescription className="text-xs">{description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
