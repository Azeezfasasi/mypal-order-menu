export interface ICreateMenuCategoryDTO {
    business_id: string;
    name: string;
    is_active: boolean;
}

export interface ICreateMenuItemDTO {
    category_id: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    unit_type: string;
    is_available: boolean;
    image: File;
}

export interface IEditMenuItemDTO {
    category_id: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    unit_type: string;
    is_available: boolean;
    image?: File;
}

export type MenuCategoryResponse = {
    id: string;
    name: string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    items: {
        id: string;
        name: string;
        description: string;
        price: string;
        stock_quantity: number;
        unit_type: string;
        is_available: boolean;
        image_url: string;
        createdAt: string;
        updatedAt: string;
    }[];
}[]

export interface ICreateOrder {
    waiter_name: string;
    guest_count: number;
    items: {
        menu_item_id: string;
        quantity: number;
        special_notes: string;
    }[];
}

export interface ICreateResponse {
    business: {
        id: string;
    };
    table_id: string | null;
    waiter_name: string;
    guest_count: number;
    subtotal: number;
    vat_amount: number;
    service_charge_amount: number;
    total_amount: number;
    payment_status: "UNPAID" | "PAID" | "PENDING" | string;
    payment_method: string | null;
    id: string;
    createdAt: string;
    updatedAt: string;
}

interface IOrder {
    id: string;
    table_id: string | null;
    waiter_name: string;
    guest_count: number;
    subtotal: string;
    vat_amount: string;
    service_charge_amount: string;
    total_amount: string;
    payment_status: string;
    payment_method: string | null;
    createdAt: string;
    updatedAt: string;
    items: {
        id: string;
        quantity: number;
        special_notes: string | null;
        kitchen_status: string;
        createdAt: string;
        updatedAt: string;
        menu_item: {
            id: string;
            name: string;
            description: string;
            price: string;
            stock_quantity: number;
            unit_type: string;
            is_available: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }[];
}

interface IKitchenTicket {
    order_id: string;
    table_id: string | null;
    waiter_name: string;
    items: {
        id: string;
        menu_item: {
            id: string;
            name: string;
        };
        quantity: number;
        special_notes: string | null;
        kitchen_status: string;
        createdAt: string;
    }[];
}

export type IOrdersResponse = IOrder[]

export type IKitchenTicketList = IKitchenTicket[]
