"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MobilityApi, toKobo } from "@/services/api/mobility-api";
import { uploadAccommodationFiles } from "@/services/api/upload-utils";
import {
  MOBILITY_CATEGORIES,
  VEHICLE_FEATURE_LABELS,
  type MobilityCategory,
  type MobilityVehicle,
  type VehicleFeature,
  type VehiclePayload,
} from "@/types/mobility-types";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this vehicle; omit to add a new one */
  vehicle?: MobilityVehicle | null;
  defaultCategory: MobilityCategory;
}

const emptyForm = (category: MobilityCategory) => ({
  make: "",
  model: "",
  vehicle_class: "",
  company_name: "",
  plate_number: "",
  category,
  seat_count: "4",
  features: [] as VehicleFeature[],
  total_units: "1",
  available_units: "1",
  out_of_service_units: "0",
  base_price: "",
  discount_percentage: "",
  description: "",
  is_active: true,
});

export function VehicleFormDialog({ open, onOpenChange, vehicle, defaultCategory }: VehicleFormDialogProps) {
  const [form, setForm] = useState(emptyForm(defaultCategory));
  const [images, setImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const create = MobilityApi.useCreateVehicle();
  const update = MobilityApi.useUpdateVehicle();
  const isEdit = !!vehicle;

  // Local previews for photos not uploaded yet
  const previews = useMemo(() => newFiles.map((file) => URL.createObjectURL(file)), [newFiles]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    if (!open) return;
    setNewFiles([]);
    if (vehicle) {
      setForm({
        make: vehicle.make,
        model: vehicle.model,
        vehicle_class: vehicle.vehicle_class,
        company_name: vehicle.company_name ?? "",
        plate_number: vehicle.plate_number,
        category: vehicle.category ?? defaultCategory,
        seat_count: String(vehicle.seat_count ?? ""),
        features: vehicle.features,
        total_units: String(vehicle.total_units),
        available_units: String(vehicle.available_units),
        out_of_service_units: String(vehicle.out_of_service_units),
        base_price: vehicle.base_price ? String(vehicle.base_price) : "",
        discount_percentage: vehicle.discount_percentage ? String(vehicle.discount_percentage) : "",
        description: vehicle.description ?? "",
        is_active: vehicle.is_active,
      });
      setImages(vehicle.gallery_images);
    } else {
      setForm(emptyForm(defaultCategory));
      setImages([]);
    }
  }, [open, vehicle, defaultCategory]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleFeature = (feature: VehicleFeature) =>
    set(
      "features",
      form.features.includes(feature) ? form.features.filter((f) => f !== feature) : [...form.features, feature]
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const total = Number(form.total_units);
    const available = Number(form.available_units);
    const outOfService = Number(form.out_of_service_units || 0);

    if (!form.make.trim() || !form.model.trim() || !form.vehicle_class.trim() || !form.plate_number.trim()) {
      toast.error("Make, model, class and plate number are required");
      return;
    }
    if (!(Number(form.seat_count) >= 1 && Number(form.seat_count) <= 60)) {
      toast.error("Seats must be between 1 and 60");
      return;
    }
    if (!(total >= 1)) {
      toast.error("Total units must be at least 1");
      return;
    }
    if (available < 0 || outOfService < 0 || available + outOfService > total) {
      toast.error("Available and out-of-service units can't add up to more than the total");
      return;
    }
    if (!(Number(form.base_price) > 0)) {
      toast.error("Enter a base price");
      return;
    }
    const discount = form.discount_percentage ? Number(form.discount_percentage) : undefined;
    if (discount !== undefined && (discount < 0 || discount > 100)) {
      toast.error("Discount must be between 0 and 100%");
      return;
    }

    let galleryImages = images;
    if (newFiles.length) {
      setIsUploading(true);
      try {
        galleryImages = [...images, ...(await uploadAccommodationFiles(newFiles))];
      } catch (error) {
        toast.error("Could not upload photos", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const payload: VehiclePayload = {
      make: form.make.trim(),
      model: form.model.trim(),
      vehicle_class: form.vehicle_class.trim(),
      company_name: form.company_name.trim() || undefined,
      plate_number: form.plate_number.trim().toUpperCase(),
      category: form.category,
      seat_count: Number(form.seat_count),
      features: form.features,
      gallery_images: galleryImages,
      total_units: total,
      available_units: available,
      out_of_service_units: outOfService,
      base_price_kobo: toKobo(Number(form.base_price)),
      discount_percentage: discount,
      description: form.description.trim() || undefined,
      is_active: form.is_active,
    };

    const onSuccess = () => onOpenChange(false);
    if (vehicle) update.mutate({ id: vehicle.id, payload }, { onSuccess });
    else create.mutate(payload, { onSuccess });
  };

  const isSaving = isUploading || create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this vehicle's details." : "Add a vehicle type to your fleet. Riders see it when booking."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photos */}
          <div>
            <Label>Photos</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((url) => (
                <div key={url} className="relative h-20 w-28 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {previews.map((preview, index) => (
                <div key={preview} className="relative h-20 w-28 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400"
              >
                <ImagePlus className="h-5 w-5" />
                Add photo
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setNewFiles((prev) => [...prev, ...files]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            <Field label="Make">
              <Input value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="e.g. Toyota" />
            </Field>
            <Field label="Model">
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Camry" />
            </Field>
            <Field label="Class">
              <Input
                value={form.vehicle_class}
                onChange={(e) => set("vehicle_class", e.target.value)}
                placeholder="e.g. Executive"
              />
            </Field>
            <Field label="Plate number">
              <Input
                value={form.plate_number}
                onChange={(e) => set("plate_number", e.target.value)}
                placeholder="e.g. ABC123JC"
              />
            </Field>
            {/* Fixed to the business's own mobility category */}
            <Field label="Category">
              <Input value={MOBILITY_CATEGORIES.find((c) => c.id === form.category)?.title ?? ""} disabled />
            </Field>
            <Field label="Seats">
              <Input
                type="number"
                min={1}
                max={60}
                value={form.seat_count}
                onChange={(e) => set("seat_count", e.target.value)}
              />
            </Field>
            <Field label="Company name (optional)">
              <Input
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="Shown on the booking card"
              />
            </Field>
            <Field label="Base price (₦)">
              <Input
                type="number"
                min={0}
                value={form.base_price}
                onChange={(e) => set("base_price", e.target.value)}
                placeholder="e.g. 9500"
              />
            </Field>
            <Field label="Total units">
              <Input type="number" min={1} value={form.total_units} onChange={(e) => set("total_units", e.target.value)} />
            </Field>
            <Field label="Available units">
              <Input
                type="number"
                min={0}
                value={form.available_units}
                onChange={(e) => set("available_units", e.target.value)}
              />
            </Field>
            <Field label="Out of service units">
              <Input
                type="number"
                min={0}
                value={form.out_of_service_units}
                onChange={(e) => set("out_of_service_units", e.target.value)}
              />
            </Field>
            <Field label="Discount % (optional)">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.discount_percentage}
                onChange={(e) => set("discount_percentage", e.target.value)}
                placeholder="e.g. 10"
              />
            </Field>
          </div>

          <Field label="Features">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(VEHICLE_FEATURE_LABELS) as VehicleFeature[]).map((feature) => {
                const selected = form.features.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      selected
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {VEHICLE_FEATURE_LABELS[feature]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Description (optional)">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Designed for professionals and event guests who value comfort."
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Visible to riders</p>
              <p className="text-xs text-gray-500">Turn off to hide this vehicle from bookings.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>

          <DialogFooter className="gap-2 sm:flex-col-reverse">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSaving}>
              {isUploading ? "Uploading photos…" : isSaving ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">{label}</Label>
      {children}
    </div>
  );
}
