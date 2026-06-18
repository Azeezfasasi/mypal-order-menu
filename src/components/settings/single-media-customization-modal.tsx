"use client";

import { FileUploader } from "@/components/offerings/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type Mode = "image" | "video" | "flyer" | "custom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: Mode;
  initialValue?: string;
  onSubmit: (payload: {
    // support multiple images
    files?: File[] | null;
    file?: File | null;
    type: Mode;
    value?: string | null;
  }) => void | Promise<void>;
}

export default function SingleMediaCustomizationModal({
  isOpen,
  onClose,
  mode,
  initialValue = "",
  onSubmit,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  // react-hook-form must be called unconditionally
  type CustomFormValues = {
    customType: "color_theme" | "slogan" | "tags";
    customValue: string;
  };
  const form = useForm<CustomFormValues>({
    defaultValues: { customType: "slogan", customValue: initialValue || "" },
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = form;

  const MAX_TAGS = 5;
  const MAX_FILES = 30;
  const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  const validateCustomValue = (val: string) => {
    const type = watch("customType");
    if (type === "color_theme") {
      if (!val || !HEX_REGEX.test(val))
        return "Enter a valid hex color (e.g. #FF5733)";
      return true;
    }
    if (type === "tags") {
      const tags = String(val || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length > MAX_TAGS) return `Maximum ${MAX_TAGS} tags allowed`;
      return true;
    }
    // slogan or other types: require non-empty
    if (type === "slogan") {
      if (!String(val || "").trim()) return "Slogan cannot be empty";
    }
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setSelectedFiles(null);
      // update form values
      // reset will set both customType and customValue below
      reset({ customType: "slogan", customValue: initialValue || "" });
    }
  }, [isOpen, initialValue, reset]);

  // create a stable preview URL when selectedFile changes and revoke previous
  useEffect(() => {
    let current: string | undefined;
    if (selectedFile) {
      current = URL.createObjectURL(selectedFile);
      setPreviewUrl(current);
    } else {
      setPreviewUrl(undefined);
    }

    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  }, [selectedFile]);

  if (!isOpen) return null;

  // when using FileUploader, it will call onFileChange with File[] | null
  const handleFilesChange = (files: File[] | null) => {
    if (!files || files.length === 0) {
      setSelectedFiles(null);
      setSelectedFile(null);
      return;
    }

    // Enforce a global maximum selectable files (e.g. large bulk uploads)
    let incoming = files;
    if (incoming.length > MAX_FILES) {
      toast.error(
        `Maximum ${MAX_FILES} files allowed — only the first ${MAX_FILES} will be used.`,
      );
      incoming = Array.from(incoming).slice(0, MAX_FILES);
    }

    // Enforce max 5 for flyer (branded filters)
    if (mode === "flyer" && incoming.length > 5) {
      toast.error(
        "Maximum 5 branded filters allowed — only the first 5 will be used.",
      );
      incoming = incoming.slice(0, 5);
    }

    // setSelectedFiles(prev => [...prev, incoming]);

    // setSelectedFiles(prev => {
    //   if (!prev) { return incoming }
    //   else {
    //     return [
    //       ...Array.from(prev),
    //       ...(incoming instanceof File ? [incoming] : Array.from(incoming))
    //     ]
    //   }
    // });

    setSelectedFiles(prev => {
      const newFiles = incoming instanceof File ? [incoming] : Array.from(incoming);
      return prev ? [...prev, ...newFiles] : newFiles;
    });

    // set a preview for the first file for quick view
    if (incoming && incoming.length > 0) setSelectedFile(incoming[0]);
    else setSelectedFile(null);
  };

  const onFormSubmit = async (data: CustomFormValues) => {
    try {
      setIsSubmitting(true);
      if (mode === "custom") {
        const t = data.customType;
        const v = data.customValue;
        await onSubmit({
          files: null,
          file: null,
          type: mode,
          value: `${t}::${v}`,
        });
      } else if (mode === "image") {
        // multiple image files
        await onSubmit({ files: selectedFiles || null, type: mode });
      } else if (mode === "flyer") {
        // flyer (branded filters) supports multiple files
        await onSubmit({ files: selectedFiles || null, type: mode });
      } else {
        // video - single file
        await onSubmit({ file: selectedFile, type: mode });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {mode === "custom"
              ? "Add Customization"
              : `Add ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
          </h3>
          <Button variant="ghost" onClick={onClose} type="button">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-col gap-4 flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-1">
            {mode === "custom" ? (
              <div>
                <Form {...form}>
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={"slogan"}
                        onValueChange={(v) => {
                          // v will be one of the allowed strings
                          setValue(
                            "customType",
                            v as CustomFormValues["customType"],
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="color_theme">
                            Color Theme
                          </SelectItem>
                          <SelectItem value="slogan">Slogan</SelectItem>
                          <SelectItem value="tags">Tags</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>

                  {/* Value field varies by selected type (color shows color picker + swatches) */}
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      {/* watch current customType to decide what to show */}
                      {(() => {
                        const currentType = watch("customType");
                        if (currentType === "color_theme") {
                          const PRESET = [
                            "#FF5733",
                            "#FF8A65",
                            "#2196F3",
                            "#4CAF50",
                            "#FFC107",
                            "#9C27B0",
                          ];
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Controller
                                  control={control}
                                  name="customValue"
                                  rules={{ validate: validateCustomValue }}
                                  render={({ field }) => (
                                    <>
                                      <input
                                        type="color"
                                        value={field.value || "#000000"}
                                        onChange={(e) =>
                                          field.onChange(e.target.value)
                                        }
                                        className="w-12 h-8 p-0 border rounded"
                                        aria-label="Color picker"
                                      />
                                      <Input
                                        value={field.value || ""}
                                        onChange={(e) =>
                                          field.onChange(e.target.value)
                                        }
                                        placeholder="#FF5733"
                                      />
                                    </>
                                  )}
                                />
                              </div>
                              <div className="flex gap-2">
                                {PRESET.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    aria-label={`Select ${c}`}
                                    onClick={() => setValue("customValue", c)}
                                    className={`w-8 h-8 rounded-md border ${watch("customValue") === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                                    style={{ background: c }}
                                  />
                                ))}
                              </div>
                              {errors.customValue && (
                                <div className="text-xs text-destructive">
                                  {String(errors.customValue.message)}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // default: text input for slogan or tags
                        return (
                          <div>
                            <Input
                              {...register("customValue", {
                                validate: validateCustomValue,
                              })}
                              placeholder={
                                currentType === "tags"
                                  ? "Comma separated tags"
                                  : "Enter slogan text"
                              }
                            />
                            {errors.customValue && (
                              <div className="text-xs text-destructive">
                                {String(errors.customValue.message)}
                              </div>
                            )}
                            {currentType === "tags" && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {String(watch("customValue") || "")
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter(Boolean)
                                  .slice(0, MAX_TAGS)
                                  .map((tag, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-muted rounded-md text-sm"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </FormControl>
                  </FormItem>
                </Form>
              </div>
            ) : (
              <div>
                <div>
                  {mode === "image" ? (
                    <FileUploader
                      filePreview={[]}
                      onFileChange={(files) => handleFilesChange(files)}
                      onFilePreviewChange={() => { }}
                      inputId="media-modal-images"
                      multiple
                      maxFiles={MAX_FILES}
                      acceptedTypes={["image/*"]}
                      maxSizeMB={25}
                      label="Click to upload or drag and drop image(s) here"
                    />
                  ) : (
                    <FileUploader
                      filePreview={selectedFile ? [previewUrl || ""] : null}
                      onFileChange={(files) => {
                        handleFilesChange(files);
                        if (files && files.length > 0)
                          setSelectedFile(files[0]);
                      }}
                      onFilePreviewChange={() => { }}
                      inputId={`media-modal-${mode}`}
                      multiple={mode === "flyer"}
                      maxFiles={
                        mode === "flyer" ? 5 : mode === "video" ? 1 : MAX_FILES
                      }
                      acceptedTypes={
                        mode === "video" ? ["video/*"] : ["image/*"]
                      }
                      maxSizeMB={mode === "video" ? 60 : 10}
                      label={
                        mode === "flyer"
                          ? "Click to upload or drag and drop branded filter(s) here"
                          : "Click to upload or drag and drop file here"
                      }
                      description={
                        mode === "flyer"
                          ? "Upload up to 5 branded filters. Max 10MB each."
                          : "Maximum file size: 60MB"
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onFormSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
