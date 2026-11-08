"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingsListTab } from "./BookingsListTab";
import { CalendarTab } from "./CalendarTab";
import { ExperienceScheduleTab } from "./ExperienceScheduleTab";
import { ManualBookingDialog } from "./ManualBookingDialog";
import { ReviewsTab } from "./ReviewsTab";

const TABS = [
  { id: "bookings", label: "Bookings" },
  { id: "calendar", label: "Availability Calendar" },
  { id: "experiences", label: "Experience Schedule" },
  { id: "reviews", label: "Reviews" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Beach Houses bookings (guide §6) */
export default function BeachHouseBookingsPage() {
  const [tab, setTab] = useState<TabId>("bookings");
  const [creating, setCreating] = useState(false);

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4 md:flex-col">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500">Check guests in, settle deposits, manage availability and reply to reviews.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2 bg-orange-600 text-white hover:bg-orange-700">
          <Plus className="h-4 w-4" /> New Booking
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg border px-5 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "border-orange-200 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "bookings" && <BookingsListTab />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "experiences" && <ExperienceScheduleTab />}
      {tab === "reviews" && <ReviewsTab />}

      <ManualBookingDialog open={creating} onOpenChange={setCreating} />
    </main>
  );
}
