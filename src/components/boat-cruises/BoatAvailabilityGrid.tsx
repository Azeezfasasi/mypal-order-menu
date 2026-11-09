"use client";

import { useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Loader2, Lock, Ship, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import type { BoatGridRow, GridState } from "@/types/boat-cruise-types";
import { useBoatNav } from "./boat-nav";
import { BoatBookingStatusBadge } from "./BoatBookingStatusBadge";
import { formatDay, formatNaira, formatTime, GRID_STYLES, parseDay, toIsoDay } from "./boat-utils";

const LEGEND: { state: GridState; label: string; dot: string }[] = [
  { state: "AVAILABLE", label: "Available", dot: "bg-green-500" },
  { state: "LOW", label: "Low", dot: "bg-orange-400" },
  { state: "SOLD_OUT", label: "Sold out", dot: "bg-red-500" },
  { state: "BLOCKED", label: "Blocked", dot: "bg-gray-400" },
];

const SECTIONS = [
  { id: "BOAT", title: "Boat types" },
  { id: "YACHT", title: "Yacht Types" },
] as const;

/** Availability & Inventory (Figma): boat types × 7 days; each cell is how many boats of that type are free */
export function BoatAvailabilityGrid() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewing, setViewing] = useState<{ row: BoatGridRow; date: string } | null>(null);
  const start = toIsoDay(weekStart);
  const end = toIsoDay(addDays(weekStart, 6));
  const { data, isLoading, isFetching, isError, refetch } = BoatCruisesApi.useGrid(start, end);
  const block = BoatCruisesApi.useBlockSlot();
  const today = toIsoDay(new Date());

  const dates = data?.dates ?? Array.from({ length: 7 }, (_, i) => toIsoDay(addDays(weekStart, i)));
  const sections = useMemo(() => {
    const rows = data?.offerings ?? [];
    return SECTIONS.map((s) => ({ ...s, rows: rows.filter((r) => r.section === s.id) })).filter((s) => s.rows.length);
  }, [data]);

  const toggleBlock = (row: BoatGridRow, date: string, blocked: boolean) =>
    block.mutate(
      { entity_id: row.id, dates: [date], is_blocked: !blocked },
      { onSuccess: () => toast.success(`${row.name}: ${formatDay(date, { day: "numeric", month: "short" })} ${blocked ? "opened" : "blocked"}`) }
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {format(weekStart, "MMMM yyyy")}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={weekStart}
                defaultMonth={weekStart}
                onSelect={(d) => {
                  if (d) setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
                  setPickerOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            <button type="button" aria-label="Previous week" onClick={() => setWeekStart((w) => addDays(w, -7))} className="border-r border-gray-300 p-2 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Next week" onClick={() => setWeekStart((w) => addDays(w, 7))} className="p-2 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="text-lg font-semibold text-gray-900 hover:text-orange-600"
        >
          Today
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {LEGEND.map((l) => (
            <span key={l.state} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-gray-700">
              <span className={cn("h-2 w-2 rounded-full", l.dot)} /> {l.label}
            </span>
          ))}
          {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
      </div>

      <div className="overflow-x-auto border-t border-gray-200">
        <div className="min-w-[1050px]">
          <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-200 bg-[#F9FAFB] text-xs">
            <div className="p-4 text-center font-medium uppercase tracking-wider text-[#667185]">Inventory</div>
            {dates.map((d) => (
              <div key={d} className={cn("p-4 text-center font-medium text-[#344054]", d === today && "text-orange-600")}>
                {format(parseDay(d), "EEE, MMM d")}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading availability…
            </div>
          ) : isError ? (
            <p className="p-6 text-sm text-gray-500">
              Couldn&apos;t load availability.{" "}
              <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
                Try again
              </button>
            </p>
          ) : sections.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No published boats yet. Add them under Services and Offerings.</p>
          ) : (
            sections.map((section) => (
              <div key={section.id}>
                <div className="border-b border-gray-200 bg-white py-3 text-center text-xs text-gray-500">{section.title}</div>
                {section.rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-gray-200 last:border-0">
                    <div className="flex items-center gap-3 border-r border-gray-100 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9F0FD] text-[#114CCC]">
                        <Ship className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[13px] font-bold leading-tight text-[#001633]">{row.name}</p>
                        <p className="text-xs font-medium text-[#012657]">Total: {row.total_capacity}</p>
                      </div>
                    </div>
                    {dates.map((date) => (
                      <GridCell
                        key={date}
                        row={row}
                        date={date}
                        past={date < today}
                        busy={block.isPending}
                        onView={() => setViewing({ row, date })}
                        onToggleBlock={(blocked) => toggleBlock(row, date, blocked)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <DayBookingsDialog viewing={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function GridCell({
  row,
  date,
  past,
  busy,
  onView,
  onToggleBlock,
}: {
  row: BoatGridRow;
  date: string;
  past: boolean;
  busy: boolean;
  onView: () => void;
  onToggleBlock: (blocked: boolean) => void;
}) {
  const cell = row.cells[date];
  const state: GridState = cell?.state ?? "AVAILABLE";
  const blocked = state === "BLOCKED" || Boolean(cell?.is_blocked);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("flex min-h-[92px] items-center border-r border-[#E4E7EC] px-5 text-left transition last:border-0 hover:brightness-95", GRID_STYLES[state], past && "opacity-60")}
        >
          {blocked ? (
            <span className="font-bold">Blocked</span>
          ) : state === "SOLD_OUT" ? (
            <span className="font-bold">Sold out</span>
          ) : (
            <span>
              <span className="block font-semibold">{cell?.left ?? row.total_capacity} left</span>
              <span className="block text-[13px] font-medium text-[#012657]">{cell?.price ? formatNaira(cell.price) : "—"}</span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-[280px] overflow-hidden rounded-[10px] p-0">
        <div className="p-5">
          <h3 className="font-bold text-[#101928]">{row.name}</h3>
          <p className="mt-1 text-xs text-[#667185]">{formatDay(date, { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {cell?.left ?? 0} of {cell?.total ?? row.total_capacity} free{cell?.booked ? ` · ${cell.booked} booked` : ""}
            </span>
            <span className="font-bold text-[#012657]">{cell?.price ? `${formatNaira(cell.price)}/hr` : "—"}</span>
          </div>
        </div>
        <div className="border-t border-gray-100">
          <button type="button" onClick={onView} className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-gray-100">
            <Eye className="h-5 w-5" /> View Bookings
          </button>
          {!past && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggleBlock(blocked)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : blocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              {blocked ? "Unblock" : "Block"} every {row.name.toLowerCase()} this day
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** That day's bookings for one boat type */
function DayBookingsDialog({ viewing, onClose }: { viewing: { row: BoatGridRow; date: string } | null; onClose: () => void }) {
  const nav = useBoatNav();
  const { data, isLoading } = BoatCruisesApi.useBookings(
    { from: viewing?.date, to: viewing?.date, limit: 100, sort: "start_asc" },
    viewing !== null
  );
  const boatIds = new Set(viewing?.row.boats?.map((b) => b.id) ?? []);
  const items = (data?.items ?? []).filter((b) =>
    viewing ? b.booking_date === viewing.date && (boatIds.size ? boatIds.has(b.boat?.id ?? "") : b.boat?.boat_type === viewing.row.name) : false
  );

  return (
    <Dialog open={viewing !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{viewing?.row.name} bookings</DialogTitle>
          <DialogDescription>{viewing && formatDay(viewing.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">No bookings on this day.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {items.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    nav.openBooking(b.id);
                  }}
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{b.boat?.name}</span>
                    <BoatBookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)} · {b.reserver?.name ?? "Guest"} · {b.guests?.total ?? "—"} guests ·{" "}
                    <span className="font-mono">{b.reference}</span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
