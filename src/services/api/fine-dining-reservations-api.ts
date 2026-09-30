import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BaseApiResponse } from "@/types/api";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// Normalised reservation shown on the Reservations page
export interface IFineDiningReservation {
    id: string;
    reservation_id: string;
    status?: string;
    date: string;
    time: string | null;
    end_time: string | null;
    no_of_adults: number;
    no_of_children: number;
    total_individuals: number;
    createdAt: string;
    business?: { id: string; name: string };
    guest: { name: string; email: string | null; phone: string | null };
    special_request: string | null;
    dietary_options: string | string[] | null;
    occasion: string | null;
    experience: string | null;
    table_id: string | null;
    source: string | null;
    third_party_platform: string | null;
    block_reason: string | null;
    amount?: number;
    payment_status?: string;
}

export interface IFineDiningReservationPage {
    reservations: IFineDiningReservation[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        hasPrevious: boolean;
        hasNext: boolean;
    };
    // Only some response shapes include per-status totals
    statusCounts: Record<string, number> | null;
}

export interface IFineDiningReservationParams {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    enabled?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type TRawRecord = Record<string, any>;

const named = (value: any): string | null =>
    value == null ? null : typeof value === "object" ? value.name ?? value.title ?? null : String(value);

const guestName = (source: TRawRecord, user: TRawRecord | null) =>
    user?.name
    ?? ([user?.firstname, user?.lastname].filter(Boolean).join(" ")
        || source.name
        || [source.guest_first_name, source.guest_last_name].filter(Boolean).join(" ")
        || "Guest");

// The endpoint returns either flat reservations or `{ id, status, details: {...} }` wrappers
const normalizeReservation = (raw: TRawRecord): IFineDiningReservation => {
    const source: TRawRecord = raw.details ?? raw;
    const user: TRawRecord | null = source.user ?? raw.user ?? null;

    return {
        id: source.id ?? raw.id,
        reservation_id: source.reservation_id ?? raw.reservation_id ?? raw.id,
        status: source.status ?? raw.status,
        date: source.date ?? source.start_time ?? "",
        time: source.time ?? source.start_time ?? null,
        end_time: source.end_time ?? null,
        no_of_adults: source.no_of_adults ?? source.party_size ?? 0,
        no_of_children: source.no_of_children ?? 0,
        total_individuals: source.total_individuals ?? source.party_size ?? 0,
        createdAt: source.createdAt ?? raw.createdAt,
        business: source.business
            ? { id: source.business.id, name: source.business.name ?? source.business.business_name }
            : undefined,
        guest: {
            name: guestName(source, user),
            email: user?.email ?? source.guest_email ?? null,
            phone: user?.phone ?? source.guest_phone ?? null,
        },
        special_request: source.special_request || source.special_requests || null,
        dietary_options: source.dietary_options ?? null,
        occasion: named(source.occasion),
        experience: named(source.experience),
        table_id: source.table_id ?? null,
        source: source.source ?? null,
        third_party_platform: source.third_party_platform ?? null,
        block_reason: source.block_reason ?? null,
        amount: source.amount ?? undefined,
        payment_status: source.payment_status ?? undefined,
    };
};

const normalizePage = (data: TRawRecord): IFineDiningReservationPage => {
    const list: TRawRecord[] = data?.reservations ?? data?.data ?? [];
    const meta: TRawRecord = data?.pagination ?? data ?? {};

    return {
        reservations: list.map(normalizeReservation),
        pagination: {
            total: meta.total ?? list.length,
            page: meta.page ?? 1,
            totalPages: meta.totalPages ?? 1,
            hasPrevious: Boolean(meta.hasPrevious),
            hasNext: Boolean(meta.hasNext),
        },
        statusCounts: data?.statusCounts ?? null,
    };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// The backend rejects page sizes above 100
export const MAX_PAGE_SIZE = 100;

const fetchReservationPage = async (params: Omit<IFineDiningReservationParams, "enabled">) => {
    const response = await apiClient.get<BaseApiResponse<TRawRecord>>(
        ENDPOINTS.BUSINESS.RESERVATIONS,
        {
            params: {
                type: "finedining",
                page: params.page,
                limit: Math.min(params.limit, MAX_PAGE_SIZE),
                ...(params.status ? { status: params.status } : {}),
                ...(params.search ? { search: params.search } : {}),
            },
        }
    );
    return normalizePage(response.data.data);
};

export interface IFineDiningReservationBatchParams {
    maxItems: number;
    status?: string;
    search?: string;
    enabled?: boolean;
}

export const FineDiningReservationsApi = {
    // Read-only: managers view reservations here, status changes stay with the backend
    useGetReservations: ({ enabled = true, ...params }: IFineDiningReservationParams) =>
        useQuery<IFineDiningReservationPage>({
            queryKey: ["fine-dining-reservations", params],
            enabled,
            queryFn: () => fetchReservationPage(params),
            placeholderData: keepPreviousData,
            refetchInterval: 30000,
        }),

    // Loads up to `maxItems` reservations by walking 100-item pages, so the page can
    // sort and search across more than one backend page
    useGetReservationBatch: ({ enabled = true, maxItems, ...params }: IFineDiningReservationBatchParams) =>
        useQuery<IFineDiningReservationPage>({
            queryKey: ["fine-dining-reservations", "batch", maxItems, params],
            enabled,
            queryFn: async () => {
                const pageCount = Math.ceil(maxItems / MAX_PAGE_SIZE);
                const first = await fetchReservationPage({ ...params, page: 1, limit: MAX_PAGE_SIZE });
                const reservations = [...first.reservations];
                let last = first;

                for (let page = 2; page <= pageCount && last.pagination.hasNext; page++) {
                    last = await fetchReservationPage({ ...params, page, limit: MAX_PAGE_SIZE });
                    reservations.push(...last.reservations);
                }

                return {
                    reservations,
                    pagination: { ...first.pagination, hasNext: last.pagination.hasNext },
                    statusCounts: first.statusCounts,
                };
            },
            placeholderData: keepPreviousData,
            refetchInterval: 30000,
        }),
};
