import { IOrder } from "@/types/fine-din-menu-orders-types";
import { SingleTableResponse } from "@/types/table-management-types";

export type TKitchenStatus = "PENDING" | "PREPARING" | "READY" | "SERVED";
export type TOrderSource = "WAITER" | "QR";
export type TTableStatus = "AVAILABLE" | "OCCUPIED" | "PENDING" | "RESERVED";

// Minutes a ticket is expected to spend in preparation, used for the progress bar
export const TARGET_PREP_MINUTES = 30;

export const orderCode = (id: string) =>
    `#${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

// Orders placed through the digital menu come in without a waiter
export const getOrderSource = (waiterName?: string | null): TOrderSource =>
    waiterName?.trim() ? "WAITER" : "QR";

export const takenByLabel = (waiterName?: string | null) =>
    getOrderSource(waiterName) === "WAITER" ? waiterName!.trim() : "Customer";

export const getItemsStatus = (items: { kitchen_status: string }[]): TKitchenStatus => {
    const statuses = items.map((item) => item.kitchen_status);

    if (!statuses.length) return "PENDING";
    if (statuses.every((s) => s === "SERVED")) return "SERVED";
    if (statuses.every((s) => s === "READY" || s === "SERVED")) return "READY";
    if (statuses.some((s) => s !== "PENDING")) return "PREPARING";
    return "PENDING";
};

export const isActiveOrder = (order: IOrder) => order.payment_status !== "PAID";

export const itemCount = (items: { quantity: number }[]) =>
    items.reduce((sum, item) => sum + item.quantity, 0);

export const formatTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const minutesSince = (date: string | Date) =>
    Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));

export const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const days = Math.floor(minutes / 1440);
    return `${days} day${days === 1 ? "" : "s"}`;
};

export const formatNaira =(amount: number | string) =>
    `₦${Number(amount).toLocaleString()}`;

export const formatDateParam = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

export const sortByNewest = <T extends { createdAt: string }>(list: T[]) =>
    [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getTableStatus = (activeOrders: IOrder[], isReserved: boolean): TTableStatus => {
    if (activeOrders.length) {
        return activeOrders.every((order) => getItemsStatus(order.items) === "PENDING")
            ? "PENDING"
            : "OCCUPIED";
    }
    return isReserved ? "RESERVED" : "AVAILABLE";
};

export const tableLabel = (tables: SingleTableResponse[] | undefined, tableId: string | null) => {
    if (!tableId) return "No table";
    return tables?.find((table) => table.id === tableId)?.label ?? "Table";
};

export const KITCHEN_STATUS_STYLES: Record<TKitchenStatus, { label: string; badge: string; accent: string }> = {
    PENDING: { label: "Pending", badge: "bg-orange-50 text-orange-600", accent: "border-l-orange-500" },
    PREPARING: { label: "Preparing", badge: "bg-amber-50 text-amber-600", accent: "border-l-amber-400" },
    READY: { label: "Ready", badge: "bg-green-50 text-green-600", accent: "border-l-green-600" },
    SERVED: { label: "Served", badge: "bg-slate-100 text-slate-600", accent: "border-l-slate-400" },
};

export const TABLE_STATUS_STYLES: Record<TTableStatus, { label: string; card: string; text: string }> = {
    AVAILABLE: { label: "Available", card: "border-green-100 bg-white", text: "text-green-600" },
    OCCUPIED: { label: "Occupied", card: "border-blue-200 bg-blue-50/40", text: "text-blue-600" },
    PENDING: { label: "Pending", card: "border-orange-200 bg-orange-50/40", text: "text-orange-600" },
    RESERVED: { label: "Reserved", card: "border-purple-200 bg-white", text: "text-purple-600" },
};
