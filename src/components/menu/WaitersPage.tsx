'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Plus, Search, Users, Zap } from "lucide-react";
import Header from "./Header";
import { OrderCard } from "./ViewOrders";
import TableDetailsPanel from "./TableDetailsPanel";
import { OrdersTable, StatusBadge, useTableBoard } from "./OrderShared";
import {
    TABLE_STATUS_STYLES,
    formatTime,
    getItemsStatus,
    getOrderSource,
    itemCount,
    orderCode,
    tableLabel,
    takenByLabel,
} from "./order-utils";

type TWaiterTab = "tables" | "active" | "recent";

const WaitersPage = () => {
    const router = useRouter();
    const { tables, orders, activeOrders, activeOrdersForTable, statusForTable, isLoading } = useTableBoard();

    const [tab, setTab] = useState<TWaiterTab>("tables");
    const [search, setSearch] = useState("");
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
    const filteredTables = tables.filter((table) =>
        table.label.toLowerCase().includes(search.trim().toLowerCase()));

    const tabs: { id: TWaiterTab; label: string }[] = [
        { id: "tables", label: "Tables Overview" },
        { id: "active", label: "Active Orders" },
        { id: "recent", label: "Recent Orders" },
    ];

    return (
        <div>
            <Header showActions={false} />

            <div className="flex items-center gap-4 border-b border-gray-200 mb-6 md:flex-wrap md:pb-3">
                <div className="flex mr-auto overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setTab(item.id)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === item.id
                                ? "text-orange-600 border-orange-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="relative md:flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setTab("tables");
                        }}
                        placeholder="Search tables..."
                        className="h-9 w-[280px] md:w-full pl-9 pr-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-orange-400"
                    />
                </div>
                <button
                    onClick={() => router.push("/table-management")}
                    className="h-9 flex items-center gap-1 px-4 rounded-[8px] bg-orange-50 text-orange-600 text-sm font-semibold hover:bg-orange-100 whitespace-nowrap"
                >
                    <Plus size={15} /> Reserve a Table
                </button>
            </div>

            {isLoading ? (
                <div className="my-5 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    loading . . .
                </div>
            ) : tab === "tables" ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-1 gap-5 items-start">
                        {filteredTables.length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-300 rounded-[12px] p-8 text-center text-sm text-gray-500">
                                {tables.length === 0 ? (
                                    <>
                                        No tables set up yet.{" "}
                                        <button onClick={() => router.push("/table-management/get-started")} className="text-orange-600 font-semibold hover:underline">
                                            Set up tables
                                        </button>
                                    </>
                                ) : "No tables match your search."}
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 2xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-3">
                                {filteredTables.map((table) => {
                                    const status = statusForTable(table.id);
                                    const style = TABLE_STATUS_STYLES[status];
                                    const tableOrders = activeOrdersForTable(table.id);
                                    const StatusIcon = status === "RESERVED" ? CalendarClock : Zap;

                                    return (
                                        <button
                                            key={table.id}
                                            onClick={() => setSelectedTableId(table.id)}
                                            className={`relative border rounded-[12px] p-4 text-center transition-shadow hover:shadow-md ${style.card} ${selectedTableId === table.id ? "ring-2 ring-orange-400" : ""}`}
                                        >
                                            <Users size={14} className={`absolute left-3 top-3 ${style.text}`} />
                                            {status !== "AVAILABLE" && <StatusIcon size={14} className={`absolute right-3 top-3 ${style.text}`} />}
                                            <p className={`text-xl font-bold mt-2 ${style.text}`}>{table.label}</p>
                                            <p className="text-xs text-gray-500">
                                                {table.capacity} Seats{table.quantity > 1 ? ` · ×${table.quantity}` : ""}
                                            </p>
                                            <p className={`text-[10px] font-bold uppercase mt-1 ${style.text}`}>{style.label}</p>
                                            {tableOrders.length > 0 && (
                                                <p className={`text-[11px] font-medium ${style.text}`}>
                                                    {tableOrders.length} Order{tableOrders.length > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedTable ? (
                            <TableDetailsPanel
                                table={selectedTable}
                                status={statusForTable(selectedTable.id)}
                                orders={activeOrdersForTable(selectedTable.id)}
                                onClose={() => setSelectedTableId(null)}
                            />
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-[12px] p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">Active Orders</h3>
                                    <button onClick={() => setTab("active")} className="text-xs font-semibold text-orange-600 hover:underline">View All</button>
                                </div>
                                {activeOrders.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-3">No active orders.</p>
                                ) : (
                                    <div className="divide-y">
                                        {activeOrders.slice(0, 4).map((order) => (
                                            <div key={order.id} className="py-3 flex justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {tableLabel(tables, order.table_id)} • {orderCode(order.id)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{itemCount(order.items)} items</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        By {takenByLabel(order.waiter_name)} ({getOrderSource(order.waiter_name) === "WAITER" ? "Waiter" : "QR"})
                                                    </p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <StatusBadge status={getItemsStatus(order.items)} />
                                                    <p className="text-[11px] text-gray-400">{formatTime(order.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <OrdersTable title="Recent Orders" orders={orders} tables={tables} />
                </div>
            ) : tab === "active" ? (
                activeOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">No active orders.</p>
                ) : (
                    <div className="grid grid-cols-3 lg:grid-cols-2 sm:grid-cols-1 gap-4">
                        {activeOrders.map((order) => <OrderCard key={order.id} order={order} />)}
                    </div>
                )
            ) : (
                <OrdersTable title="Recent Orders" orders={orders} tables={tables} limit={20} />
            )}
        </div>
    );
};

export default WaitersPage;
