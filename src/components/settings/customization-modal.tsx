"use client";

import { Button } from "@/components/ui/button";
import { BusinessMediaApi } from "@/services/api/business-media-api";
import { Save, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "color_theme" | "slogan" | "tags";
  initialValue?: string;
}

export default function CustomizationModal({
  isOpen,
  onClose,
  defaultType = "color_theme",
  initialValue = "",
}: CustomizationModalProps) {
  const [type, setType] = useState<"color_theme" | "slogan" | "tags">(
    defaultType,
  );
  const [value, setValue] = useState<string>(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setValue(initialValue);
    }
  }, [isOpen, defaultType, initialValue]);

  const { mutate: uploadMedia } = BusinessMediaApi.useUploadBusinessMedia();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("type", type);
      formData.append("value", value);

      uploadMedia(formData);

      toast.success("Customization uploaded.");
      onClose();
    } catch (err) {
      console.error("Failed to upload customization:", err);
      toast.error("Failed to upload customization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-xl mx-4 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Manage Customization</h3>
          <Button variant="ghost" onClick={onClose} type="button">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setType(e.target.value as "color_theme" | "slogan" | "tags")
              }
            >
              <option value="color_theme">Color Theme</option>
              <option value="slogan">Slogan</option>
              <option value="tags">Tags</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            {type === "color_theme" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value || "#000000"}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-12 h-10 p-0 border rounded"
                    aria-label="Pick a color"
                  />
                  <input
                    type="text"
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="#FF5733"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Vibrant presets
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "#FF3B30",
                      "#FF9500",
                      "#FFCC00",
                      "#34C759",
                      "#0A84FF",
                      "#5856D6",
                      "#FF2D55",
                      "#FF9F0A",
                      "#7F5AF0",
                      "#00C2A8",
                      "#FF6B6B",
                      "#8E44AD",
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Select ${c}`}
                        onClick={() => setValue(c)}
                        className={`w-8 h-8 rounded-md border transition-all ${
                          value?.toLowerCase() === c.toLowerCase()
                            ? "ring-2 ring-offset-2 ring-primary"
                            : ""
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder={
                  type === "slogan"
                    ? "Enter slogan text"
                    : "Comma separated tags"
                }
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              For color theme use a hex color (e.g. #FF5733). For tags provide
              comma-separated values.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
