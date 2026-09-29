'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, ClipboardList, Loader2, Plus, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { IOrder } from "@/types/fine-din-menu-orders-types";
import { SingleTableResponse } from "@/types/table-management-types";
import { OrderCard } from "./ViewOrders";
import { StatusBadge } from "./OrderShared";
import {
    TABLE_STATUS_STYLES,
    TTableStatus,
    formatNaira,
    formatTime,
    getItemsStatus,
    itemCount,
    minutesSince,
    orderCode,
    takenByLabel,
} from "./order-utils";

interface ITableDetailsPanelProps {
    table: SingleTableResponse | null;
    status: TTableStatus | null;
    orders: IOrder[];
    onClose: () => void;
}

const TableDetailsPanel = ({ table, status, orders, onClose }: ITableDetailsPanelProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const updateKitchenStatusMutation = MenuAndOrdersApi.useUpdateKitchenTicketStatus();

    const [showAll, setShowAll] = useState(false);
    const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
    const detailOrder = orders.find((order) => order.id === detailOrderId);

    const oldestOrder = orders[orders.length - 1];
    const visibleOrders = showAll ? orders : orders.slice(0, 1);
    const preparingItems = orders.flatMap((order) => order.items.filter((item) => item.kitchen_status === "PREPARING"));

    const handleMarkAsReady = async () => {
        try {
            await Promise.all(preparingItems.map((item) =>
                updateKitchenStatusMutation.mutateAsync({ id: item.id, payload: { status: "READY" } })
            ));
            toast.success("Orders marked as ready");
        } finally {
            queryClient.invalidateQueries({ queryKey: ["menu-orders", "kitchen-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["menu-orders", "orders"] });
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-[12px] p-5 space-y-5 shadow-sm h-fit">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">{table ? "Table Details" : "Order Details"}</h3>
                <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
                    <X size={18} />
                </button>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                    <UserRound size={22} className="text-orange-500" />
                </div>
                <p className="text-lg font-bold text-gray-800">
                    {table ? `Table ${table.label}` : orders[0] ? orderCode(orders[0].id) : "Walk-in"}
                </p>
                {status && (
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-50 ${TABLE_STATUS_STYLES[status].text}`}>
                        {TABLE_STATUS_STYLES[status].label}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 border-y py-3 text-center">
                <div className="flex flex-col items-center gap-1">
                    <Users size={16} className="text-gray-500" />
                    <p className="text-sm font-bold text-gray-800">{table ? `${table.capacity} Seats` : "—"}</p>
                    <p className="text-[10px] text-gray-400">Capacity</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ClipboardList size={16} className="text-gray-500" />
                    <p className="text-sm font-bold text-gray-800">{orders.length} Orders</p>
                    <p className="text-[10px] text-gray-400">Active</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Clock size={16} className="text-gray-500" />
                    <p className="text-sm font-bold text-gray-800">{oldestOrder ? `${minutesSince(oldestOrder.createdAt)} mins` : "—"}</p>
                    <p className="text-[10px] text-gray-400">Duration</p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 uppercase">Active Orders ({orders.length})</p>
                    {orders.length > 1 && (
                        <button onClick={() => setShowAll(!showAll)} className="text-[11px] font-semibold text-orange-600 hover:underline">
                            {showAll ? "Show Less" : "View All"}
                        </button>
                    )}
                </div>

                {orders.length === 0 ? (
                    <p className="text-sm text-gray-500">No active orders on this table.</p>
                ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto">
                        {visibleOrders.map((order) => (
                            <div key={order.id} className="border border-gray-200 rounded-[10px] p-3 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{orderCode(order.id)}</p>
                                        <p className="text-[11px] text-gray-400">{itemCount(order.items)} items</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <StatusBadge status={getItemsStatus(order.items)} />
                                        <p className="text-[11px] text-gray-400">{formatTime(order.createdAt)}</p>
                                    </div>
                                </div>

                                <ul className="space-y-1.5 text-xs">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="flex justify-between gap-2">
                                            <span className="text-gray-600">• {item.quantity}x {item.menu_item.name}</span>
                                            <span className="font-semibold text-gray-800">{formatNaira(Number(item.menu_item.price) * item.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t pt-2 space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Total Amount</span>
                                        <span className="font-bold text-gray-800">{formatNaira(order.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Taken By</span>
                                        <span className="text-gray-700">{takenByLabel(order.waiter_name)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDetailOrderId(order.id)}
                                    className="w-full py-2 rounded-[8px] bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100"
                                >
                                    View Order Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">{table ? "Table Actions" : "Actions"}</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => router.push(table ? `/menu/orders?table=${table.id}` : "/menu/orders")}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-orange-50 text-orange-600 text-sm font-semibold hover:bg-orange-100"
                    >
                        <Plus size={15} /> Add Order
                    </button>
                    <button
                        onClick={handleMarkAsReady}
                        disabled={preparingItems.length === 0 || updateKitchenStatusMutation.isPending}
                        title={preparingItems.length === 0 ? "No items are being prepared" : undefined}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updateKitchenStatusMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        Mark as Ready
                    </button>
                </div>
            </div>

            <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrderId(null)}>
                <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Order details</DialogTitle>
                    </DialogHeader>
                    {detailOrder && <OrderCard order={detailOrder} />}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TableDetailsPanel;
