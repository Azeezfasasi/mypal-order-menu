export interface IBlockUnblockInventorySlotDTO {
    entity_id: string;
    entity_type: string;
    dates: string[];
    is_blocked: boolean;
}

export interface IOverrideSlotPriceDTO {
    entity_id: string;
    entity_type: string;
    dates: string[];
    price_override: number;
}

export interface ICreateManualReservationDTO {
    entity_id: string;
    entity_type: string;
    source: string;
    ota_name: string;
    guest_name: string;
    start_date: string;
    end_date: string;
    quantity: number;
    amount: number;
    notes: string
}

export interface IReservationGridResponse {
    message: string;
    data: {
        dates: string[];
        offerings: {
            id: string;
            name: string;
            type: string;
            total_capacity: number;
            cells: Record<string, {
                price: number;
                is_blocked: false,
                booked: number;
                available: number;
            }>,
        }[]
    }
}

export interface ILiveReservationResponse {
    message: string;
    data: {
        accommodations: {
            id: string;
            idempotencyKey: string | null;
            reservation_id: string;
            no_of_adults: number;
            no_of_children: number;
            total_individuals: number;
            check_in_date: string;
            check_out_date: string;
            check_in_time: string | null;
            check_out_time: string | null;
            business_type: string;
            amount: number;
            source: string;
            ota_name: string | null;
            guest_name: string;
            notes: string;
            status: string;
            createdAt: string;
            updatedAt: string;
            deletedAt: string | null;
        }[],
        tickets: []
    }
}

export interface IRetireveReservationResponse {
    message: string;
    data: {
        id: string;
        idempotencyKey: string | null;
        reservation_id: string;
        no_of_adults: number;
        no_of_children: number;
        total_individuals: number;
        check_in_date: string;
        check_out_date: string;
        check_in_time: string | null;
        check_out_time: string | null;
        business_type: string;
        amount: number;
        source: string;
        ota_name: string | null;
        guest_name: string;
        notes: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        accomodations: {
            id: string;
            apartment_name: string;
            apartment_type: string;
            apartment_description: string;
            total_units: number;
            business_accomodation_type: string;
            image_urls: string[];
            location: {
                city: string;
                state: string;
                address: string;
                country: string;
                latitude: number;
                longitude: number;
            };
            specifications: {
                floor: number;
                bedType: string;
                guestCapacity: number;
            };
            pricing: {
                basePricePerNight: number;
            };
            rules: {
                allowPets: boolean;
                checkInTime: string;
                allowParties: boolean;
                checkOutTime: string;
            };
            createdAt: string;
            updatedAt: string;
        }[];
    }[];
}