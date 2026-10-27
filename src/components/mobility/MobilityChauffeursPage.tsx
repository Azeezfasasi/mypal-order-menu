"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Phone, Plus, Star, UserRound } from "lucide-react";
import { toast } from "sonner";
import { MobilityPagination } from "./MobilityPagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobilityApi } from "@/services/api/mobility-api";
import { uploadAccommodationFiles } from "@/services/api/upload-utils";
import { initials } from "./mobility-utils";

const PAGE_SIZE = 20;

export default function MobilityChauffeursPage() {
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading } = MobilityApi.useDrivers({ page, limit: PAGE_SIZE });
  const drivers = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6 md:space-y-4">
      <div className="flex items-start justify-between gap-4 md:flex-col">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 md:text-2xl">Chauffeurs</h1>
          <p className="mt-1 text-sm text-gray-600">The drivers in your fleet. Assign them to bookings from the bookings list.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 md:w-full">
          <Plus className="h-4 w-4" /> Add Chauffeur
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <UserRound className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No chauffeurs yet.</p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-1 text-sm font-medium text-orange-600 hover:underline"
          >
            Add your first chauffeur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-2 md:grid-cols-1">
          {drivers.map((driver) => (
            <div key={driver.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-lg font-semibold text-gray-600">
                {driver.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={driver.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(driver.full_name)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{driver.full_name}</p>
                <p className="flex items-center gap-1 text-sm text-gray-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {driver.rating !== undefined ? driver.rating.toFixed(1) : "New"}
                  {driver.total_trips !== undefined && (
                    <span className="text-gray-400">({driver.total_trips.toLocaleString()} trips)</span>
                  )}
                </p>
                {driver.phone_number && (
                  <a
                    href={`tel:${driver.phone_number.replace(/\s+/g, "")}`}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {driver.phone_number}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(data?.total ?? 0) > PAGE_SIZE && (
        <MobilityPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <AddChauffeurDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddChauffeurDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const create = MobilityApi.useCreateDriver();
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setPhone("");
    setPhoto(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Enter the chauffeur's full name");
      return;
    }
    if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone.trim())) {
      toast.error("Enter a valid phone number");
      return;
    }

    let avatarUrl: string | undefined;
    if (photo) {
      setIsUploading(true);
      try {
        [avatarUrl] = await uploadAccommodationFiles([photo]);
      } catch (error) {
        toast.error("Could not upload photo", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
        return;
      } finally {
        setIsUploading(false);
      }
    }

    create.mutate(
      { full_name: fullName.trim(), phone_number: phone.trim() || undefined, avatar_url: avatarUrl },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add chauffeur</DialogTitle>
          <DialogDescription>Add a driver to your fleet so you can assign them to bookings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400"
              aria-label="Choose profile photo"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
            <p className="text-sm text-gray-500">Profile photo (optional)</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Daniel Emenike" />
          </div>
          <div className="space-y-2">
            <Label>Phone number (optional)</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678" />
          </div>
          <DialogFooter className="gap-2 sm:flex-col-reverse">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isUploading || create.isPending}
            >
              {isUploading ? "Uploading photo…" : create.isPending ? "Saving…" : "Add chauffeur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
