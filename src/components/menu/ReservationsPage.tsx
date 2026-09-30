'use client'
import { Fragment, useEffect, useMemo, useState } from "react";
import {
    CalendarDays, ChevronLeft, ChevronRight, Clock, Eye, Loader2, Mail, Phone, Search, Users,
} from "lucide-react";
import Header from "./Header";
import { useAuthStore } from "@/stores/auth-store";
import { TableManagementApi } from "@/services/api/table-management-api";
import {
    FineDiningReservationsApi,
    IFineDiningReservation,
    MAX_PAGE_SIZE,
} from "@/services/api/fine-dining-reservations-api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    RESERVATION_STATUS_STYLES,
    formatReservationDate,
    formatTimeRange,
    isReservationToday,
    splitByBookingDate,
} from "./reservation-utils";

const PAGE_SIZE = 20;
// The API pages by creation date, so we load a larger batch and order it by booking date here
const SAMPLE_SIZE = 300;

const STATUS_TABS = [
    { value: "", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Booked", label: "Booked" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Blocked", label: "Blocked Slots" },
];

const SOURCE_LABELS: Record<string, string> = {
    DASHBOARD: "Added by staff",
    APP: "MyPal app",
    MOBILE: "MyPal app",
    THIRD_PARTY: "Third-party platform",
};

const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const orDash = (value: string | number | null | undefined) =>
    value === null || value === undefined || value === "" ? "—" : value;

const StatusPill = ({ status }: { status?: string }) => (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${RESERVATION_STATUS_STYLES[status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
        {status ?? "Unknown"}
    </span>
);

const ReservationsPage = () => {
    const business = useAuthStore((state) => state.business);
    const [status, setStatus] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Debounce the search so each keystroke doesn't hit the API
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const isSearching = search.length > 0;

    // The backend search only matches reservation IDs, so guest details are
    // matched on the client against the loaded batch
    const listQuery = FineDiningReservationsApi.useGetReservationBatch({
        maxItems: SAMPLE_SIZE,
        status,
    });
    const idSearchQuery = FineDiningReservationsApi.useGetReservations({
        page: 1,
        limit: MAX_PAGE_SIZE,
        status,
        search,
        enabled: isSearching,
    });
    const { data, isLoading, isError } = listQuery;
    const isFetching = listQuery.isFetching || (isSearching && idSearchQuery.isFetching);
    const { data: tablesResponse } = TableManagementApi.useGetAllTables();

    const ownBusinessIds = useMemo(
        () => new Set([business?.id, ...(business?.linkedBusinesses ?? []).map((linked) => linked.id)].filter(Boolean)),
        [business]
    );

    const tableName = (tableId: string | null) =>
        tableId ? tablesResponse?.data?.find((table) => table.id === tableId)?.label ?? null : null;

    // Keep only this business's bookings; "All" leaves out blocked slots
    const reservations = useMemo(() => {
        const query = search.toLowerCase();
        const matchesSearch = (reservation: IFineDiningReservation) =>
            [
                reservation.reservation_id,
                reservation.guest.name,
                reservation.guest.email,
                reservation.guest.phone,
                reservation.occasion,
                reservation.experience,
                tableName(reservation.table_id),
            ].some((value) => value?.toLowerCase().includes(query));

        const candidates = isSearching
            ? [
                ...(idSearchQuery.data?.reservations ?? []),
                ...(data?.reservations ?? []).filter(matchesSearch),
            ].filter((reservation, index, list) => list.findIndex((other) => other.id === reservation.id) === index)
            : data?.reservations ?? [];

        return candidates.filter((reservation) =>
            (!reservation.business?.id || ownBusinessIds.has(reservation.business.id))
            && (status || reservation.status !== "Blocked")
        );
        // tableName reads from tablesResponse
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, idSearchQuery.data, isSearching, search, ownBusinessIds, status, tablesResponse]);

    const { upcoming, past } = useMemo(() => splitByBookingDate(reservations), [reservations]);
    const sorted = useMemo(() => [...upcoming, ...past], [upcoming, past]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageRows = sorted.slice(pageStart, pageStart + PAGE_SIZE);
    const isTruncated = Boolean(data?.pagination.hasNext);

    const selected = reservations.find((reservation) => reservation.id === selectedId) ?? null;

    return (
        <div>
            <Header showActions={false} />

            <div className="flex items-center gap-4 border-b border-gray-200 mb-6 md:flex-wrap md:pb-3">
                <div className="flex mr-auto overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => {
                                setStatus(tab.value);
                                setPage(1);
                            }}
                            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${status === tab.value
                                ? "text-orange-600 border-orange-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative md:flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search guest, phone, table or ID..."
                        className="h-9 w-[280px] md:w-full pl-9 pr-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-orange-400"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-[12px] p-5 md:p-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-800">Fine Dining Reservations</h3>
                        <p className="text-xs text-gray-500">
                            {isSearching
                                ? `${sorted.length} match${sorted.length === 1 ? "" : "es"} for "${search}"`
                                : `${sorted.length} reservation${sorted.length === 1 ? "" : "s"}`}
                            {` · ${upcoming.length} upcoming · sorted by date · view only`}
                            {isTruncated && ` · showing the latest ${SAMPLE_SIZE} bookings`}
                        </p>
                    </div>
                    {isFetching && !isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
                </div>

                {isLoading ? (
                    <div className="my-6 flex items-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        loading reservations . . .
                    </div>
                ) : isError ? (
                    <p className="text-sm text-red-600 py-6">Could not load reservations. Please try again.</p>
                ) : sorted.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6">No reservations found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 border-b">
                                    <th className="font-medium py-3 pr-3">Reservation ID</th>
                                    <th className="font-medium py-3 pr-3">Guest</th>
                                    <th className="font-medium py-3 pr-3">Date & Time</th>
                                    <th className="font-medium py-3 pr-3">Party</th>
                                    <th className="font-medium py-3 pr-3">Table</th>
                                    <th className="font-medium py-3 pr-3">Occasion</th>
                                    <th className="font-medium py-3 pr-3">Status</th>
                                    <th className="font-medium py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((reservation, index) => {
                                    const position = pageStart + index;
                                    const isPast = position >= upcoming.length;
                                    // Section heading where upcoming or past bookings start on this page
                                    const heading = position === 0 && upcoming.length
                                        ? `Upcoming (${upcoming.length})`
                                        : position === upcoming.length
                                            ? `Past (${past.length})`
                                            : index === 0
                                                ? `${isPast ? "Past" : "Upcoming"} (continued)`
                                                : null;

                                    return (
                                    <Fragment key={reservation.id}>
                                    {heading && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={8} className="py-2 px-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                                {heading}
                                            </td>
                                        </tr>
                                    )}
                                    <tr
                                        onClick={() => setSelectedId(reservation.id)}
                                        className={`border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${isPast ? "opacity-70" : ""}`}
                                    >
                                        <td className="py-3 pr-3 font-semibold text-gray-800 whitespace-nowrap">{reservation.reservation_id}</td>
                                        <td className="py-3 pr-3">
                                            <p className="text-gray-800">{reservation.guest.name}</p>
                                            {reservation.guest.email && <p className="text-[11px] text-gray-400">{reservation.guest.email}</p>}
                                        </td>
                                        <td className="py-3 pr-3 whitespace-nowrap">
                                            <p className="text-gray-800">
                                                {formatReservationDate(reservation.date)}
                                                {isReservationToday(reservation.date) && (
                                                    <span className="ml-2 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">TODAY</span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-gray-400">{formatTimeRange(reservation)}</p>
                                        </td>
                                        <td className="py-3 pr-3 text-gray-700 whitespace-nowrap">{reservation.total_individuals} guests</td>
                                        <td className="py-3 pr-3 text-gray-700">{orDash(tableName(reservation.table_id))}</td>
                                        <td className="py-3 pr-3 text-gray-700">{orDash(reservation.occasion)}</td>
                                        <td className="py-3 pr-3"><StatusPill status={reservation.status} /></td>
                                        <td className="py-3 text-right">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                                                <Eye size={14} /> View
                                            </span>
                                        </td>
                                    </tr>
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-2 border-t text-xs text-gray-500">
                        <span>Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-[6px] hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>
                            <button
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-[6px] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
                <SheetContent className="w-full sm:max-w-full max-w-md overflow-y-auto">
                    {selected && <ReservationDetails reservation={selected} tableName={tableName(selected.table_id)} />}
                </SheetContent>
            </Sheet>
        </div>
    );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-4 py-2 text-sm">
        <span className="text-gray-500 shrink-0">{label}</span>
        <span className="text-gray-800 font-medium text-right break-words min-w-0">{value}</span>
    </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">{title}</p>
        <div className="divide-y border-y">{children}</div>
    </div>
);

const ReservationDetails = ({ reservation, tableName }: { reservation: IFineDiningReservation; tableName: string | null }) => {
    const dietary = Array.isArray(reservation.dietary_options)
        ? reservation.dietary_options.join(", ")
        : reservation.dietary_options;
    const hasPayment = reservation.amount !== undefined || reservation.payment_status !== undefined;

    return (
        <div className="space-y-6">
            <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 flex-wrap">
                    {reservation.reservation_id}
                    <StatusPill status={reservation.status} />
                </SheetTitle>
                <SheetDescription>Booked {formatDateTime(reservation.createdAt)}</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-2">
                <div className="bg-orange-50 rounded-[10px] p-3">
                    <CalendarDays size={16} className="text-orange-600" />
                    <p className="text-sm font-bold text-gray-800 mt-2">{formatReservationDate(reservation.date)}</p>
                </div>
                <div className="bg-blue-50 rounded-[10px] p-3">
                    <Clock size={16} className="text-blue-600" />
                    <p className="text-sm font-bold text-gray-800 mt-2">{formatTimeRange(reservation)}</p>
                </div>
                <div className="bg-green-50 rounded-[10px] p-3">
                    <Users size={16} className="text-green-600" />
                    <p className="text-sm font-bold text-gray-800 mt-2">{reservation.total_individuals} guests</p>
                </div>
            </div>

            <Section title="Guest">
                <DetailRow label="Name" value={reservation.guest.name} />
                <DetailRow
                    label="Email"
                    value={reservation.guest.email
                        ? <a href={`mailto:${reservation.guest.email}`} className="inline-flex items-center gap-1 text-orange-600 hover:underline"><Mail size={13} /> {reservation.guest.email}</a>
                        : "—"}
                />
                <DetailRow
                    label="Phone"
                    value={reservation.guest.phone
                        ? <a href={`tel:${reservation.guest.phone}`} className="inline-flex items-center gap-1 text-orange-600 hover:underline"><Phone size={13} /> {reservation.guest.phone}</a>
                        : "—"}
                />
            </Section>

            <Section title="Booking">
                <DetailRow label="Table" value={orDash(tableName)} />
                <DetailRow label="Occasion" value={orDash(reservation.occasion)} />
                <DetailRow label="Experience" value={orDash(reservation.experience)} />
                <DetailRow label="Booked via" value={orDash(reservation.source ? SOURCE_LABELS[reservation.source] ?? reservation.source : null)} />
                {reservation.third_party_platform && <DetailRow label="Platform" value={reservation.third_party_platform} />}
                <DetailRow label="Business" value={orDash(reservation.business?.name)} />
            </Section>

            <Section title="Party">
                <DetailRow label="Adults" value={reservation.no_of_adults} />
                <DetailRow label="Children" value={reservation.no_of_children} />
                <DetailRow label="Total guests" value={reservation.total_individuals} />
            </Section>

            <Section title="Requests">
                <DetailRow label="Special request" value={orDash(reservation.special_request)} />
                <DetailRow label="Dietary options" value={orDash(dietary)} />
            </Section>

            {reservation.block_reason && (
                <Section title="Blocked slot">
                    <DetailRow label="Reason" value={reservation.block_reason} />
                </Section>
            )}

            {hasPayment && (
                <Section title="Payment">
                    <DetailRow label="Amount" value={reservation.amount !== undefined ? `₦${Number(reservation.amount).toLocaleString()}` : "—"} />
                    <DetailRow label="Payment status" value={orDash(reservation.payment_status)} />
                </Section>
            )}
        </div>
    );
};

export default ReservationsPage;
