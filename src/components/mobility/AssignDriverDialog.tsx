"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Star, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MobilityApi } from "@/services/api/mobility-api";
import type { MobilityBooking } from "@/types/mobility-types";
import { initials } from "./mobility-utils";

interface AssignDriverDialogProps {
  booking: MobilityBooking | null;
  onOpenChange: (open: boolean) => void;
}

export function AssignDriverDialog({ booking, onOpenChange }: AssignDriverDialogProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data, isLoading } = MobilityApi.useDrivers();
  const assign = MobilityApi.useAssignDriver();
  const drivers = data?.items ?? [];

  useEffect(() => {
    if (booking) setSelectedId(booking.driver?.id);
  }, [booking]);

  const submit = (driverId?: string) => {
    if (!booking) return;
    assign.mutate({ id: booking.id, driverId }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={!!booking} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{booking?.driver ? "Change chauffeur" : "Assign chauffeur"}</DialogTitle>
          <DialogDescription>Booking {booking?.reference}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            No chauffeurs yet.{" "}
            <Link href="/mobility/chauffeurs" className="font-medium text-orange-600 hover:underline">
              Add a chauffeur
            </Link>
          </div>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {drivers.map((driver) => {
              const selected = driver.id === selectedId;
              return (
                <li key={driver.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(driver.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected ? "border-orange-300 bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {driver.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={driver.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(driver.full_name)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900">{driver.full_name}</span>
                      <span className="flex items-center gap-2 text-xs text-gray-500">
                        {driver.rating !== undefined && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {driver.rating.toFixed(1)}
                          </span>
                        )}
                        {driver.phone_number}
                      </span>
                    </span>
                    {selected && <Check className="h-4 w-4 text-orange-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter className="gap-2 sm:flex-col-reverse">
          {booking?.driver && (
            <Button
              variant="ghost"
              className="mr-auto text-red-600 hover:text-red-700 sm:mr-0"
              disabled={assign.isPending}
              onClick={() => submit(undefined)}
            >
              <UserX className="mr-2 h-4 w-4" />
              Unassign
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            disabled={!selectedId || selectedId === booking?.driver?.id || assign.isPending}
            onClick={() => submit(selectedId)}
          >
            {assign.isPending ? "Saving…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
