"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Check, Filter, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import TableDetailsPanel from "./TableDetailsPanel";
import { OrdersTable, SourceLabel, useTableBoard } from "./OrderShared";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { IKitchenTicket } from "@/types/fine-din-menu-orders-types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    KITCHEN_STATUS_STYLES,
    TARGET_PREP_MINUTES,
    TKitchenStatus,
    TOrderSource,
    formatDuration,
    formatTime,
    getOrderSource,
    minutesSince,
    orderCode,
    tableLabel,
} from "./order-utils";

const COLUMNS: { status: TKitchenStatus; label: string; next?: { status: TKitchenStatus; action: string } }[] = [
    { status: "PENDING", label: "Incoming Orders", next: { status: "PREPARING", action: "Start Preparing" } },
    { status: "PREPARING", label: "In Progress", next: { status: "READY", action: "Mark Ready" } },
    { status: "READY", label: "Ready", next: { status: "SERVED", action: "Mark Served" } },
    { status: "SERVED", label: "Completed" },
];

const VISIBLE_TICKETS = 4;

type TSourceFilter = "ALL" | TOrderSource;

export default function KitchenPage() {
    const board = useTableBoard();

    const ticketQueries = {
        PENDING: MenuAndOrdersApi.useGetKitchenTickets("PENDING"),
        PREPARING: MenuAndOrdersApi.useGetKitchenTickets("PREPARING"),
        READY: MenuAndOrdersApi.useGetKitchenTickets("READY"),
        SERVED: MenuAndOrdersApi.useGetKitchenTickets("SERVED"),
    };

    const [activeColumn, setActiveColumn] = useState<TKitchenStatus>("PENDING");
    const [search, setSearch] = useState("");
    const [sourceFilter, setSourceFilter] = useState<TSourceFilter>("ALL");
    const [expanded, setExpanded] = useState<Partial<Record<TKitchenStatus, boolean>>>({});
    const [selected, setSelected] = useState<{ orderId: string; tableId: string | null } | null>(null);

    const matchesFilters = (ticket: IKitchenTicket) => {
        const query = search.trim().toLowerCase();
        const matchesSearch = !query
            || tableLabel(board.tables, ticket.table_id).toLowerCase().includes(query)
            || orderCode(ticket.order_id).toLowerCase().includes(query)
            || ticket.waiter_name?.toLowerCase().includes(query);
        const matchesSource = sourceFilter === "ALL" || getOrderSource(ticket.waiter_name) === sourceFilter;
        return matchesSearch && matchesSource;
    };

    const ticketsFor = (status: TKitchenStatus) =>
        (ticketQueries[status].data?.data ?? []).filter(matchesFilters);

    const selectedTable = selected?.tableId
        ? board.tables.find((table) => table.id === selected.tableId) ?? null
        : null;
    const selectedOrders = selectedTable
        ? board.activeOrdersForTable(selectedTable.id)
        : board.orders.filter((order) => order.id === selected?.orderId);

    return (
        <div className="space-y-6">
            <Header showActions={false} />

            {/* Column tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200 md:flex-wrap md:pb-3">
                <div className="grid grid-cols-4 flex-1 lg:flex lg:overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {COLUMNS.map((column) => (
                        <button
                            key={column.status}
                            onClick={() => setActiveColumn(column.status)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${activeColumn === column.status
                                ? "text-orange-600 border-orange-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            {column.label} ({ticketsFor(column.status).length})
                        </button>
                    ))}
                </div>
                <div className="relative md:flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tables..."
                        className="h-9 w-[200px] md:w-full pl-9 pr-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-orange-400"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`h-9 flex items-center gap-2 px-3 border rounded-[8px] text-sm ${sourceFilter !== "ALL" ? "border-orange-400 text-orange-600" : "border-gray-200 text-gray-600"}`}>
                            <Filter size={14} />
                            Filters
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuRadioGroup value={sourceFilter} onValueChange={(v) => setSourceFilter(v as TSourceFilter)}>
                            <DropdownMenuRadioItem value="ALL">All sources</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="WAITER">Waiter orders</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="QR">QR code orders</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className={`grid gap-5 items-start ${selected ? "grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-1" : "grid-cols-1"}`}>
                <div className="space-y-6 min-w-0">
                    <div className="grid grid-cols-4 lg:grid-cols-1 gap-4 items-start">
                        {COLUMNS.map((column) => {
                            const query = ticketQueries[column.status];
                            const tickets = ticketsFor(column.status);
                            const isExpanded = expanded[column.status];

                            return (
                                <div
                                    key={column.status}
                                    className={`bg-gray-50 border rounded-[12px] p-3 space-y-3 min-w-0 ${activeColumn === column.status ? "border-orange-200" : "border-gray-200 lg:hidden"}`}
                                >
                                    {query.isLoading ? (
                                        <div className="my-2 flex items-center gap-2 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            loading . . .
                                        </div>
                                    ) : tickets.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No tickets</p>
                                    ) : (
                                        (isExpanded ? tickets : tickets.slice(0, VISIBLE_TICKETS)).map((ticket) => (
                                            <KitchenTicketCard
                                                key={ticket.order_id}
                                                ticket={ticket}
                                                status={column.status}
                                                next={column.next}
                                                tableName={tableLabel(board.tables, ticket.table_id)}
                                                isSelected={selected?.orderId === ticket.order_id}
                                                onSelect={() => setSelected({ orderId: ticket.order_id, tableId: ticket.table_id })}
                                            />
                                        ))
                                    )}

                                    {tickets.length > VISIBLE_TICKETS && (
                                        <button
                                            onClick={() => setExpanded({ ...expanded, [column.status]: !isExpanded })}
                                            className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-orange-600 py-1 hover:underline"
                                        >
                                            {isExpanded ? "Show Less" : <>View All <ArrowRight size={12} /></>}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <OrdersTable
                        title="Live Order Tracker"
                        orders={board.orders}
                        tables={board.tables}
                        isLoading={board.isLoading}
                    />
                </div>

                {selected && (
                    <TableDetailsPanel
                        table={selectedTable}
                        status={selectedTable ? board.statusForTable(selectedTable.id) : null}
                        orders={selectedOrders}
                        onClose={() => setSelected(null)}
                    />
                )}
            </div>
        </div>
    );
}

interface IKitchenTicketCardProps {
    ticket: IKitchenTicket;
    status: TKitchenStatus;
    next?: { status: TKitchenStatus; action: string };
    tableName: string;
    isSelected: boolean;
    onSelect: () => void;
}

function KitchenTicketCard({ ticket, status, next, tableName, isSelected, onSelect }: IKitchenTicketCardProps) {
    const queryClient = useQueryClient();
    const updateKitchenTicketMutation = MenuAndOrdersApi.useUpdateKitchenTicketStatus();

    const statusItems = ticket.items.filter((item) => item.kitchen_status === status);
    const items = statusItems.length ? statusItems : ticket.items;
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const createdAt = items[0]?.createdAt;
    const elapsed = createdAt ? minutesSince(createdAt) : 0;

    const handleAdvance = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!next) return;

        try {
            await Promise.all(items.map((item) =>
                updateKitchenTicketMutation.mutateAsync({ id: item.id, payload: { status: next.status } })
            ));
            toast.success(`${orderCode(ticket.order_id)} moved to ${KITCHEN_STATUS_STYLES[next.status].label.toLowerCase()}`);
        } finally {
            queryClient.invalidateQueries({ queryKey: ["menu-orders", "kitchen-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["menu-orders", "orders"] });
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => e.key === "Enter" && onSelect()}
            className={`bg-white rounded-[10px] border border-gray-200 border-l-4 ${KITCHEN_STATUS_STYLES[status].accent} p-3 space-y-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow ${isSelected ? "ring-2 ring-orange-400" : ""}`}
        >
            <div className="flex justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-snug">
                        {orderCode(ticket.order_id)} • {ticket.table_id ? `Table ${tableName}` : "No table"}
                    </p>
                    <p className="text-[11px] text-gray-500">{quantity} items</p>
                </div>
                <div className="text-right shrink-0">
                    {createdAt && <p className="text-[11px] text-gray-400">{formatTime(createdAt)}</p>}
                    {status === "PENDING" && (
                        <p className="text-[10px] font-bold text-orange-600">{elapsed < 10 ? "NEW" : formatDuration(elapsed)}</p>
                    )}
                    {status === "PREPARING" && <p className="text-[11px] font-bold text-orange-600">{formatDuration(elapsed)}</p>}
                    {status === "READY" && <p className="text-[10px] font-bold text-green-600">READY</p>}
                    {status === "SERVED" && <Check size={14} className="text-green-600 ml-auto" />}
                </div>
            </div>

            {status === "PREPARING" && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${elapsed > TARGET_PREP_MINUTES ? "bg-red-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.min(100, (elapsed / TARGET_PREP_MINUTES) * 100)}%` }}
                    />
                </div>
            )}

            <ul className="text-[11px] text-gray-600 space-y-0.5">
                {items.map((item) => (
                    <li key={item.id}>
                        {item.quantity}x {item.menu_item.name}
                        {item.special_notes && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                                <AlertTriangle size={10} /> {item.special_notes}
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            <p className="text-[11px] text-gray-400 flex flex-wrap gap-1">
                Source: <SourceLabel waiterName={ticket.waiter_name} />
            </p>

            {next && (
                <button
                    onClick={handleAdvance}
                    disabled={updateKitchenTicketMutation.isPending}
                    className="w-full py-1.5 rounded-[6px] bg-orange-50 text-orange-600 text-[11px] font-semibold hover:bg-orange-100 disabled:opacity-60"
                >
                    {updateKitchenTicketMutation.isPending ? "Updating . . ." : next.action}
                </button>
            )}
        </div>
    );
}
