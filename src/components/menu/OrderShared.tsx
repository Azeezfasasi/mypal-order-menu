'use client'
import { useMemo, useState } from "react";
import { Loader2, QrCode, UserRound } from "lucide-react";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { TableManagementApi } from "@/services/api/table-management-api";
import { IOrder } from "@/types/fine-din-menu-orders-types";
import { SingleTableResponse } from "@/types/table-management-types";
import {
    KITCHEN_STATUS_STYLES,
    TKitchenStatus,
    TTableStatus,
    formatDateParam,
    formatTime,
    getItemsStatus,
    getOrderSource,
    getTableStatus,
    isActiveOrder,
    itemCount,
    orderCode,
    sortByNewest,
    tableLabel,
    takenByLabel,
} from "./order-utils";

export const StatusBadge = ({ status }: { status: TKitchenStatus }) => (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${KITCHEN_STATUS_STYLES[status].badge}`}>
        {KITCHEN_STATUS_STYLES[status].label}
    </span>
);

export const SourceBadge = ({ waiterName }: { waiterName?: string | null }) =>
    getOrderSource(waiterName) === "WAITER" ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-600 whitespace-nowrap">
            <UserRound size={11} /> Waiter
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-green-50 text-green-600 whitespace-nowrap">
            <QrCode size={11} /> QR Scan
        </span>
    );

export const SourceLabel = ({ waiterName }: { waiterName?: string | null }) =>
    getOrderSource(waiterName) === "WAITER" ? (
        <span className="inline-flex items-center gap-1 text-blue-600">
            <UserRound size={11} /> {takenByLabel(waiterName)} (Waiter)
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-green-600">
            <QrCode size={11} /> Customer (QR Code)
        </span>
    );

// Tables, orders and reservations combined into the live floor state
export const useTableBoard = () => {
    const { data: tablesResponse, isLoading: isLoadingTables } = TableManagementApi.useGetAllTables();
    const { data: ordersResponse, isLoading: isLoadingOrders } = MenuAndOrdersApi.useGetAllOrders();
    const { data: tableViewResponse } = TableManagementApi.useGetTableView({
        day: formatDateParam(new Date()),
        trigger: true,
    });

    const tables = useMemo(
        () => (tablesResponse?.data ?? []).filter((table) => table.is_active),
        [tablesResponse]
    );
    const orders = useMemo(() => sortByNewest(ordersResponse?.data ?? []), [ordersResponse]);
    const activeOrders = useMemo(() => orders.filter(isActiveOrder), [orders]);

    const activeOrdersForTable = (tableId: string) =>
        activeOrders.filter((order) => order.table_id === tableId);

    const statusForTable = (tableId: string): TTableStatus => {
        const isReserved = (tableViewResponse?.data ?? []).some(
            (view) => view.id === tableId && view.current_occupancy > 0
        );
        return getTableStatus(activeOrdersForTable(tableId), isReserved);
    };

    return {
        tables,
        orders,
        activeOrders,
        activeOrdersForTable,
        statusForTable,
        isLoading: isLoadingTables || isLoadingOrders,
    };
};

interface IOrdersTableProps {
    title: string;
    orders: IOrder[];
    tables: SingleTableResponse[];
    isLoading?: boolean;
    limit?: number;
}

export const OrdersTable = ({ title, orders, tables, isLoading, limit = 5 }: IOrdersTableProps) => {
    const [showAll, setShowAll] = useState(false);
    const visibleOrders = showAll ? orders : orders.slice(0, limit);

    return (
        <div className="bg-white border border-gray-200 rounded-[12px] p-5 md:p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-800">{title}</h3>
                {orders.length > limit && (
                    <button onClick={() => setShowAll(!showAll)} className="text-xs font-semibold text-orange-600 hover:underline">
                        {showAll ? "Show Less" : "View All"}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="my-4 flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    loading orders . . .
                </div>
            ) : orders.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No orders yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                                <th className="font-medium py-3 pr-3">Order ID</th>
                                <th className="font-medium py-3 pr-3">Table</th>
                                <th className="font-medium py-3 pr-3">Source</th>
                                <th className="font-medium py-3 pr-3">Taken By</th>
                                <th className="font-medium py-3 pr-3">Items</th>
                                <th className="font-medium py-3 pr-3">Time</th>
                                <th className="font-medium py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOrders.map((order) => (
                                <tr key={order.id} className="border-b last:border-b-0">
                                    <td className="py-3 pr-3 font-bold text-gray-800">{orderCode(order.id)}</td>
                                    <td className="py-3 pr-3 text-gray-700">{tableLabel(tables, order.table_id)}</td>
                                    <td className="py-3 pr-3"><SourceBadge waiterName={order.waiter_name} /></td>
                                    <td className="py-3 pr-3 text-gray-700">{takenByLabel(order.waiter_name)}</td>
                                    <td className="py-3 pr-3 font-semibold text-gray-800">{itemCount(order.items)} items</td>
                                    <td className="py-3 pr-3 text-gray-500">{formatTime(order.createdAt)}</td>
                                    <td className="py-3"><StatusBadge status={getItemsStatus(order.items)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
