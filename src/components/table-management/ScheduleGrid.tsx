'use client';

import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from "react";
import Image from "next/image";
import slotAvailableImage from '../../../public/images/slot-available-icon.svg'
import AddReservationModal from "./AddReservationModal";
import { DayGridResponse, WeekGridResponse } from "@/types/table-management-types";
import { TableManagementApi } from "@/services/api/table-management-api";
import BlockSlotModal, { BlockSlotDTO } from "./BlockSlotModal";
import Link from "next/link";

type Status = "A" | "P" | "F" | "C" | "B"; // C = Closed

type OperatingDay = {
    id: string;
    day: string;
    opening_time: string;
    closing_time: string;
    closes_next_day: boolean;
    is_24_hours: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

const statusStyles: Record<Status, string> = {
    A: "bg-green-500 text-white",
    P: "bg-yellow-400 text-white",
    F: "bg-red-600 text-white",
    C: "bg-gray-200 text-gray-400 cursor-not-allowed",
    B: "bg-black text-white cursor-not-allowed",
};

// Parse "09:00 AM" → hour in 24h (9), "04:00 PM" → 16
const parseHour12 = (timeStr: string): number => {
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours;
};

const ScheduleGrid = ({
    tab,
    currentDay,
    setCurrentDay,
    weekData,
    dayData,
    operatingDays,
}: {
    tab: 'week' | 'day',
    currentDay?: Date,
    setCurrentDay?: (date: Date) => void,
    weekData?: WeekGridResponse,
    dayData?: DayGridResponse,
    operatingDays?: OperatingDay[],
}) => {

    const [openModal, setOpenModal] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('');
    const [openReservationModal, setOpenReservationModal] = useState(false);

    const [openBlockModal, setOpenBlockModal] = useState(false);
    const [blockSlotData, setBlockSlotData] = useState<BlockSlotDTO | null>(null);

    // Build a map: "Monday" → { openHour: 9, closeHour: 17 } | null (closed)
    const operatingMap = (operatingDays ?? []).reduce<Record<string, { openHour: number; closeHour: number }>>((acc, day) => {
        if (!day.day) return acc;
        acc[day.day] = {
            openHour: day.is_24_hours ? 0 : parseHour12(day.opening_time),
            // If closes_next_day and closeHour would be 0 (midnight), treat as 24
            closeHour: day.is_24_hours
                ? 24
                : day.closes_next_day
                    ? 24  // runs until midnight of the next day → show all remaining hours
                    : parseHour12(day.closing_time),
        };
        return acc;
    }, {});

    const openDayNames = new Set(Object.keys(operatingMap));

    // Get full day name from a Date or date string
    const getDayName = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    };

    const buildISOFromSlot = (date: string, timeRange: string) => {
        if (!date || !timeRange) return null;
        const [startLabel, endLabel] = timeRange.split(' - ');
        const parseHour = (label: string) => {
            const [time, modifier] = label.split(' ');
            let [hours] = time.split(':').map(Number);
            if (modifier === 'PM' && hours !== 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            return hours;
        };
        const startHour = parseHour(startLabel);
        const endHour = parseHour(endLabel);
        const start = new Date(date);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(date);
        end.setHours(endHour, 0, 0, 0);
        return { date, start_time: start.toISOString(), end_time: end.toISOString() };
    };

    const [reservationPrefill, setReservationPrefill] = useState<{ date?: string; time?: string } | null>(null);

    const START_HOUR = 0;
    const END_HOUR = 24;

    const getStatusFromOccupancy = (percent: number): "A" | "P" | "F" => {
        if (percent === 0) return "A";
        if (percent < 100) return "P";
        return "F";
    };

    // ── WEEK GRID ─────────────────────────────────────────────────────────────

    const filteredHourBlocks = weekData?.days[0]?.hour_blocks.filter((block) => {
        const hour = new Date(block.start_time).getHours();
        return hour >= START_HOUR && hour < END_HOUR;
    }) ?? [];

    const allTimeSlots = filteredHourBlocks.map((block) => {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    });

    // Build raw week grid (including "C" for closed days/hours)
    const rawWeekGrid: Status[][] = filteredHourBlocks.map((hourBlock, rowIndex) => {
        const slotHour = new Date(hourBlock.start_time).getHours();

        return (weekData?.days ?? []).map((day) => {
            const dayName = getDayName(day.date);
            const opHours = operatingMap[dayName];

            // Day is closed entirely
            if (!opHours && openDayNames.size > 0) return "C";

            // Hour is outside this day's operating hours
            if (opHours && (slotHour < opHours.openHour || slotHour >= opHours.closeHour)) return "C";

            const filteredBlocks = (day.hour_blocks ?? []).filter((block) => {
                const hour = new Date(block.start_time).getHours();
                return hour >= START_HOUR && hour < END_HOUR;
            });
            const block = filteredBlocks[rowIndex];
            if (!block) return "A";

            // Check blocked first, before occupancy
            if (block.is_blocked) return "B";

            return getStatusFromOccupancy(block.occupancy_percentage);
        });
    });

    // Filter out rows where every cell is "C" (no open day covers this hour)
    const weekRowsToShow = allTimeSlots
        .map((time, idx) => ({ time, idx }))
        .filter(({ idx }) => rawWeekGrid[idx].some(s => s !== "C"));

    const weekGridFiltered = weekRowsToShow.map(({ idx }) => rawWeekGrid[idx]);
    const weekTimeSlotsFiltered = weekRowsToShow.map(({ time }) => time);

    const weekDays = weekData?.days.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: 'UTC' })
    ) ?? [];

    // ── DAY GRID ──────────────────────────────────────────────────────────────

    // ── DAY GRID ──────────────────────────────────────────────────────────────

    const currentDayName = currentDay
        ? currentDay.toLocaleDateString('en-US', { weekday: 'long' })
        : '';
    const currentDayOp = operatingMap[currentDayName];

    // True only after operatingDays has loaded and this day is genuinely not in the map
    const isDayClosed = !!operatingDays && operatingDays.length > 0 && !currentDayOp;

    const dayTables = dayData?.time_slots[0]?.tables.map(t => t.table_label) ?? [];

    const filteredDaySlots = (dayData?.time_slots ?? []).filter((slot) => {
        if (isDayClosed) return false; // closed day — show nothing

        const hour = new Date(slot.start_time).getHours();
        if (hour < START_HOUR || hour >= END_HOUR) return false;

        // Hide rows outside operating hours
        if (currentDayOp && (hour < currentDayOp.openHour || hour >= currentDayOp.closeHour)) return false;

        return true;
    });

    const dayTimeSlots = filteredDaySlots.map(slot => {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    });

    const dayGrid: Status[][] = filteredDaySlots.map(slot =>
        slot.tables.map(table => table.status === 'Booked' ? "F" : table.status === "Partially Booked" ? 'P' : table.status === 'Blocked' ? "B" : "A")
    );

    // ── Unified columns/rows/data ─────────────────────────────────────────────

    const columns = tab === 'week' ? weekDays : dayTables;
    const rows = tab === 'week' ? weekTimeSlotsFiltered : dayTimeSlots;
    const data = tab === 'week' ? weekGridFiltered : dayGrid;

    const handleCloseModal = () => {
        setCurrentStatus('');
        setSelectedSlot(null);
        setReservationPrefill(null);
        setOpenModal(false);
    };

    const handlePrevDay = () => {
        if (!currentDay || !setCurrentDay) return;
        setCurrentDay(new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - 1));
    };

    const handleNextDay = () => {
        if (!currentDay || !setCurrentDay) return;
        setCurrentDay(new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() + 1));
    };

    const [selectedSlot, setSelectedSlot] = useState<{ day?: string; time?: string } | null>(null);
    const [reservationDate, setReservationDate] = useState('');
    const [reservationStartTime, setReservationStartTime] = useState('');
    const [reservationEndTime, setReservationEndTime] = useState('');
    const [reservationTableId, setReservationTableId] = useState('');

    const { data: reservationResponse, isLoading: isLoadingReservations } = TableManagementApi.useGetReservations({
        start_time: reservationStartTime,
        end_time: reservationEndTime,
        date: reservationDate,
        table_id: reservationTableId,
    });

    const reservationData = reservationResponse?.data;

    const getReservations = (logData: {
        table?: string;
        table_id?: string;
        date: string | undefined;
        time: string;
        start_time: string | undefined;
        end_time: string | undefined;
    }) => {
        setReservationDate(logData.date ?? '');
        setReservationStartTime(logData.start_time ?? '');
        setReservationEndTime(logData.end_time ?? '');
        setReservationTableId(logData.table_id ?? '');
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        };
    };

    return (
        <div className="w-full">
            {(!dayData && !weekData) ?
                <div className="flex items-center gap-2 text-sm m-5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    loading . . .
                </div>
                :
                <div className="pb-4">

                    {tab === 'day' && (
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">
                                    {currentDay?.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                </h2>
                                <p className="text-[#8C94A6] text-sm sm:hidden">
                                    {isDayClosed ? 'Closed — no operating hours for this day' : 'Click any slot to manage'}
                                </p>
                            </div>
                            <div className="flex items-center rounded-[5px] border border-[#E1E3E7]">
                                <div onClick={handlePrevDay} className="border-r border-[#E1E3E7] text-[#344054] text-sm font-semibold flex items-center gap-2 p-2 sm:px-3 cursor-pointer">
                                    <ChevronLeft size={20} className="sm:hidden" /> prev
                                </div>
                                <div onClick={handleNextDay} className="border-l border-[#E1E3E7] text-[#344054] text-sm font-semibold flex items-center gap-2 p-2 sm:px-3 cursor-pointer">
                                    next <ChevronRight size={20} className="sm:hidden" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    <div className="overflow-x-auto">

                        {/* Show closed state banner for day view */}
                        {(tab === 'day' && isDayClosed) ?
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <h3 className="text-[#1D2739] font-semibold text-base mb-1">Closed</h3>
                                <p className="text-[#8C94A6] text-sm">
                                    {currentDay?.toLocaleDateString("en-US", { weekday: "long" })} is not an operating day for this business. To update operating days, Click <Link href={'/services'} className="text-orange-600 font-medium">here</Link>
                                </p>
                            </div>
                            :

                            // --- header ---
                            <div className="flex gap-4 text-xs text-[#344054] mb-4 p-4 bg-[#F9FAFB] w-max">
                                <div className="font-semibold shrink-0 w-[150px]">TIME</div>
                                {columns?.map((item, index) => (
                                    <div key={index} className="shrink-0 w-[90px] text-center whitespace-nowrap">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        }

                        <div className="flex flex-col gap-3 px-4">
                            {rows.map((time, rowIndex) => (
                                <div key={time} className="flex items-center gap-4">
                                    {/* Time column */}
                                    <div className="shrink-0 w-[150px] text-sm font-semibold text-[#001633]">
                                        {time}
                                    </div>

                                    {/* Slots */}
                                    {data[rowIndex].map((status, colIndex) => {
                                        const isClosed = status === "C";

                                        return (
                                            <div
                                                key={colIndex}
                                                onClick={() => {
                                                    if (isClosed) return; // non-clickable
                                                    if (status === 'B') return; // non-clickable

                                                    setOpenModal(true);
                                                    setCurrentStatus(status);

                                                    const isWeek = tab === 'week';
                                                    const rawDate = isWeek
                                                        ? weekData?.days[colIndex]?.date
                                                        : dayData?.date;

                                                    const payload = rawDate
                                                        ? buildISOFromSlot(rawDate, rows[rowIndex])
                                                        : null;

                                                    const selectedTable = !isWeek
                                                        ? dayData?.time_slots[rowIndex]?.tables[colIndex]
                                                        : null;

                                                    const logData = {
                                                        date: rawDate,
                                                        time: rows[rowIndex],
                                                        start_time: payload?.start_time,
                                                        end_time: payload?.end_time,
                                                        ...(selectedTable && {
                                                            table: selectedTable.table_label,
                                                            table_id: selectedTable.table_id,
                                                        }),
                                                    };

                                                    getReservations(logData);

                                                    setSelectedSlot({ day: columns[colIndex], time: rows[rowIndex] });
                                                    setReservationPrefill({ date: rawDate, time: rows[rowIndex] });
                                                }}
                                                className={`shrink-0 w-[90px] h-16 rounded-[8px] flex flex-col items-center justify-center gap-1 ${statusStyles[status]} ${(!isClosed && status !== 'B') ? 'cursor-pointer' : ''}`}
                                            >
                                                {isClosed ? (
                                                    <span className="text-[11px] font-medium text-gray-400">Closed</span>
                                                ) : (
                                                    <>
                                                        <span className="w-2 h-2 bg-white rounded-full" />
                                                        <span className="font-semibold">{status}</span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }

            {/* Modal — unchanged below */}
            <Dialog open={openModal} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-[500px] rounded-[10px] bg-[#F9FAFB]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>{selectedSlot?.day}</DialogTitle>
                        <p className="text-sm text-gray-600 text-left">
                            Time slot: {selectedSlot?.time}{' '}
                            {currentStatus === 'F' ? 'has been fully booked' : currentStatus === 'P' ? 'has limited availability' : 'available'}
                        </p>
                    </DialogHeader>
                    <div className="mt-2 h-fit">
                        {currentStatus === 'F' ? (
                            <div className="h-fit max-h-[300px] overflow-y-auto space-y-3 pr-2">
                                {isLoadingReservations ? (
                                    <div className="flex items-center gap-2 text-sm my-3">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        loading reservation data . . .
                                    </div>
                                ) : (
                                    reservationData?.map((res) => (
                                        <div key={res.id} className="bg-white p-3 rounded-[10px] border border-gray-300">
                                            <h3 className="text-[#475367] text-sm mb-2">Client Full Name</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold bg-[#FFECE5] border border-white">
                                                    {res.guest_first_name[0]}
                                                </div>
                                                <div className="space-y-1">
                                                    <h2 className="text-[#1D2739] font-medium">{res.guest_first_name} {res.guest_last_name}</h2>
                                                    <p className="text-[#8C94A6] text-xs">Booked on {formatDateTime(res.start_time).date}</p>
                                                    <div className="text-[#036B26] font-medium text-[10px] rounded-[8px] bg-[#E7F6EC] py-0.5 px-1.5 w-fit border border-[#B5E3C4]">confirmed</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                    <h4 className="text-[#667185] text-xs">TIME</h4>
                                                    <h2 className="text-[#475367] text-base font-semibold">{formatDateTime(res.start_time).time}</h2>
                                                    <h2 className="text-[#475367] text-[13px] font-medium">Est. finish {formatDateTime(res.end_time).time}</h2>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                    <h4 className="text-[#667185] text-xs">PARTY SIZE</h4>
                                                    <h2 className="text-[#475367] text-base font-semibold">{res.party_size} Guests</h2>
                                                    <h2 className="text-[#475367] text-[13px] font-medium">Table cap: {res.table_size}</h2>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                    <h4 className="text-[#667185] text-xs">TABLE</h4>
                                                    <h2 className="text-[#475367] text-base font-semibold">{res.table_name}</h2>
                                                    <h2 className="text-[#475367] text-[13px] font-medium">{res.table_size} seats</h2>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                    <h4 className="text-[#667185] text-xs">CONTACT</h4>
                                                    <h2 className="text-[#475367] text-base font-semibold">{res.guest_phone}</h2>
                                                    <h2 className="text-[#475367] text-[13px] font-medium">{res.guest_email}</h2>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : currentStatus === 'P' ? (
                            <>
                                {isLoadingReservations ? (
                                    <div className="flex items-center gap-2 text-sm my-3">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        loading reservation data . . .
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto">
                                        <h3 className="text-lg font-bold text-[#1A1A21] mb-1">Partially booked</h3>
                                        {reservationData && (
                                            <div className="h-fit max-h-[300px] overflow-y-auto space-y-3 pr-2">
                                                {reservationData.map((res) => (
                                                    <div key={res.id} className="bg-white p-3 rounded-[10px] border border-gray-300">
                                                        <h3 className="text-[#475367] text-sm mb-2">Client Full Name</h3>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold bg-[#FFECE5] border border-white">
                                                                {res.guest_first_name[0]}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h2 className="text-[#1D2739] font-medium">{res.guest_first_name} {res.guest_last_name}</h2>
                                                                <p className="text-[#8C94A6] text-xs">Booked on {formatDateTime(res.start_time).date}</p>
                                                                <div className="text-[#036B26] font-medium text-[10px] rounded-[8px] bg-[#E7F6EC] py-0.5 px-1.5 w-fit border border-[#B5E3C4]">confirmed</div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                                <h4 className="text-[#667185] text-xs">TIME</h4>
                                                                <h2 className="text-[#475367] text-base font-semibold">{formatDateTime(res.start_time).time}</h2>
                                                                <h2 className="text-[#475367] text-[13px] font-medium">Est. finish {formatDateTime(res.end_time).time}</h2>
                                                            </div>
                                                            <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                                <h4 className="text-[#667185] text-xs">PARTY SIZE</h4>
                                                                <h2 className="text-[#475367] text-base font-semibold">{res.party_size} Guests</h2>
                                                                <h2 className="text-[#475367] text-[13px] font-medium">Table cap: {res.table_size}</h2>
                                                            </div>
                                                            <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                                <h4 className="text-[#667185] text-xs">TABLE</h4>
                                                                <h2 className="text-[#475367] text-base font-semibold">{res.table_name}</h2>
                                                                <h2 className="text-[#475367] text-[13px] font-medium">{res.table_size} seats</h2>
                                                            </div>
                                                            <div className="p-3 bg-white border border-gray-300 rounded-[10px] space-y-1.5">
                                                                <h4 className="text-[#667185] text-xs">CONTACT</h4>
                                                                <h2 className="text-[#475367] text-base font-semibold">{res.guest_phone}</h2>
                                                                <h2 className="text-[#475367] text-[13px] font-medium">{res.guest_email}</h2>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-gray-700 text-[13px] my-3.5">
                                            Some tables are already booked for {selectedSlot?.time}. You can still make reservation for other tables
                                        </p>
                                        <div className='flex items-center justify-between'>
                                            <button className="" />
                                            <button
                                                onClick={() => { setOpenReservationModal(true); setOpenModal(false); }}
                                                className='flex items-center gap-2 justify-center bg-[#EB5119] font-medium text-white py-2 px-3 w-fit text-sm rounded-[7px] disabled:opacity-70'
                                            >
                                                <Plus /> Add Reservation
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : currentStatus === 'A' ? (
                            <div>
                                <div className="bg-[#FFFFFF] border border-[#F0F2F5] rounded-[10px] h-60 flex flex-col items-center justify-center mb-4">
                                    <Image src={slotAvailableImage} alt="" />
                                    <h3 className="text-xl font-bold text-[#1A1A21] mb-1">Slot available</h3>
                                    <p className="text-[#8C94A6] text-sm">{selectedSlot?.day}, {selectedSlot?.time}</p>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <button
                                        onClick={() => {
                                            const payload = reservationStartTime && reservationEndTime && reservationDate
                                                ? {
                                                    date: reservationDate,
                                                    start_time: reservationStartTime,
                                                    end_time: reservationEndTime,
                                                    // only include table_id if we're in day view
                                                    ...(tab === 'day' && reservationTableId ? { table_id: reservationTableId } : {}),
                                                }
                                                : null;

                                            setBlockSlotData(payload);
                                            setOpenModal(false);
                                            setOpenBlockModal(true);
                                        }}
                                        className='w-fit text-sm bg-white border border-[#667185] py-2 px-3 rounded-[7px] text-[#667185] font-semibold'
                                    >
                                        Block slot
                                    </button>
                                    <button
                                        onClick={() => { setOpenReservationModal(true); setOpenModal(false); }}
                                        className='flex items-center gap-2 justify-center bg-[#EB5119] font-medium text-white py-2 px-3 w-fit text-sm rounded-[7px] disabled:opacity-70'
                                    >
                                        <Plus /> Add Reservation
                                    </button>
                                </div>
                            </div>
                        ) : <></>}
                    </div>
                </DialogContent>
            </Dialog>

            <AddReservationModal
                openModal={openReservationModal}
                setOpenModal={setOpenReservationModal}
                prefill={reservationPrefill || undefined}
                operatingDays={operatingDays}  // ← add
            />
            <BlockSlotModal
                open={openBlockModal}
                setOpen={setOpenBlockModal}
                data={blockSlotData}
            />
        </div>
    );
};

export default ScheduleGrid;