export interface BookingRulesDTO {
    turn_time: number;
    min_notice: number;
    auto_confirm: boolean;
    waitlist_mode: boolean;
    deposit_required: boolean;
    peak_pricing: boolean;
}

export type SingleTableDTO = {
    label: string;
    capacity: number;
    location_tag: string;
    is_active: boolean;
    quantity: number;
}

export type CreateBulkTableDTO = {
    label: string;
    capacity: number;
    quantity: number;
    location: string;
    is_active: boolean;
}[]

export interface WeekGridResponse {
    start_date: string;
    end_date: string;
    total_tables: number;
    days: {
        date: string;
        occupancy_percentage: number;
        hour_blocks: {
            start_time: string;
            end_time: string;
            booked_tables: number;
            occupancy_percentage: number;
            is_blocked: boolean;
        }[]
    }[]
}

export interface DayGridResponse {
    date: string;
    total_tables: number;
    time_slots: {
        start_time: string;
        end_time: string;
        tables: {
            table_id: string;
            table_label: string;
            status: string;
        }[];
    }[]
}

export type TableViewResponse = {
    id: string;
    label: string;
    capacity: number;
    total_quantity: number;
    booked_today: number;
    current_occupancy: number;
    available_now: number;
}[]

export interface InsightsResponse {
    peak_day: string;
    weak_average: string;
    alerts: string[];
}

export interface SingleTableResponse {
    id: string;
    business_id: string;
    label: string;
    capacity: number;
    location_tag: string | null;
    quantity: number;
    is_active: boolean;
    available_quantity?: number;
}

export type AllTablesResponse = SingleTableResponse[]
export type AvailableTablesResponse = SingleTableResponse[]

export interface MakeReservationDTO {
    guest: {
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
        special_requests: string;
    },
    booking: {
        date: string;
        start_time: string;
        end_time: string;
        party_size: number;
        table_id: string;
        reservation_flow: string;
    }
}

export interface MakeReservationResponse {
    name: string;
    no_of_adults: number;
    no_of_children: number;
    date: string;
    time: string;
    status: string;
    table_id: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_phone: string;
    guest_email: string;
    party_size: number;
    start_time: string;
    end_time: string;
    special_requests: string;
    source: string;
    business: {
        id: string;
    };
    table: {
        id: string;
    };
    reservation_id: string;
    total_individuals: number;
    special_request: string | null;
    dietary_options: string | null;
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface IMakeExternalReservationDTO {
    guest: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        specialRequests?: string;
    };

    booking: {
        date: string;
        startTime: string;
        endTime: string;
        partySize: number;
        tableId: string;
    };

    external: {
        isExternal: boolean;
        platformName: string;
    };
}

export interface IReservation {
    id: string;
    reservation_id: string;

    table_id: string;
    table_name: string;
    table_size: number;

    party_size: number;

    guest_first_name: string;
    guest_last_name: string;
    guest_phone: string;
    guest_email: string;

    start_time: string; // ISO
    end_time: string;   // ISO

    special_requests: string | null;

    status: string;
    source: string;
}

export interface BlockSlotDTO {
    date: string;
    start_time: string;
    end_time: string;
    table_id?: string;
    reason?: string;
}

export interface UpdateDateTableQuantity {
    table_id: string;
    dates: string[];
    quantity_override: number;
}