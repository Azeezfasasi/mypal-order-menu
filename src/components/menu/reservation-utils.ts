import { IFineDiningReservation } from "@/services/api/fine-dining-reservations-api";

export const RESERVATION_STATUS_STYLES: Record<string, string> = {
    Pending: "bg-orange-50 text-orange-600",
    Booked: "bg-green-50 text-green-600",
    Cancelled: "bg-red-50 text-red-600",
    Blocked: "bg-slate-100 text-slate-600",
};

// The API mixes "DD-MM-YYYY" with ISO dates; parse date-only values as local days
export const parseReservationDate = (date: string) => {
    const dayFirst = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
    if (dayFirst) return new Date(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]));
    const isoDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
    if (isoDay) return new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
    return new Date(date);
};

export const formatReservationDate = (date: string) => {
    const parsed = parseReservationDate(date);
    return !date || isNaN(parsed.getTime())
        ? date || "—"
        : parsed.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export const formatReservationTime = (time: string | null) => {
    if (!time) return null;
    if (!time.includes("T")) return time;
    const parsed = new Date(time);
    return isNaN(parsed.getTime()) ? time : parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const formatTimeRange = (reservation: IFineDiningReservation) => {
    const start = formatReservationTime(reservation.time);
    const end = formatReservationTime(reservation.end_time);
    if (!start) return "—";
    return end && end !== start ? `${start} – ${end}` : start;
};

export const isReservationToday = (date: string) =>
    parseReservationDate(date).toDateString() === new Date().toDateString();

// Minutes past midnight for "12:00 PM" style or ISO times, used to order bookings within a day
const reservationMinutes = (time: string | null) => {
    if (!time) return 0;
    if (time.includes("T")) {
        const parsed = new Date(time);
        return isNaN(parsed.getTime()) ? 0 : parsed.getHours() * 60 + parsed.getMinutes();
    }
    const match = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(time);
    if (!match) return 0;
    const hour = Number(match[1]) % 12 + (match[3]?.toUpperCase() === "PM" ? 12 : 0);
    return hour * 60 + Number(match[2]);
};

export const reservationSortKey = (reservation: IFineDiningReservation) =>
    parseReservationDate(reservation.date).getTime() + reservationMinutes(reservation.time) * 60000;

// Midnight-based comparison so today's bookings count as upcoming all day
const isTodayOrLater = (reservation: IFineDiningReservation) => {
    const day = parseReservationDate(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(day.getTime()) && day >= today;
};

export const isUpcomingReservation = (reservation: IFineDiningReservation) =>
    isTodayOrLater(reservation)
    && reservation.status !== "Cancelled"
    && reservation.status !== "Blocked";

// Upcoming bookings soonest first, then past bookings most recent first
export const splitByBookingDate = (reservations: IFineDiningReservation[]) => ({
    upcoming: reservations
        .filter(isTodayOrLater)
        .sort((a, b) => reservationSortKey(a) - reservationSortKey(b)),
    past: reservations
        .filter((reservation) => !isTodayOrLater(reservation))
        .sort((a, b) => reservationSortKey(b) - reservationSortKey(a)),
});
