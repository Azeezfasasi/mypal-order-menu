'use client'
import { useMemo } from "react";
import Link from "next/link";
import {
    AlertTriangle, ArrowRight, Banknote, ChefHat, CircleCheck, ClipboardList, Clock, Flame, LayoutGrid,
    Loader2, PackageX, Receipt, Timer, UsersRound, UtensilsCrossed, Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { OrdersTable, useTableBoard } from "@/components/menu/OrderShared";
import {
    TABLE_STATUS_STYLES,
    TARGET_PREP_MINUTES,
    TKitchenStatus,
    TTableStatus,
    formatNaira,
    minutesSince,
    orderCode,
    tableLabel,
} from "@/components/menu/order-utils";

const LOW_STOCK_THRESHOLD = 5;
const CHART_COLOR = "#EA580C";

const PIPELINE: { status: TKitchenStatus; label: string; icon: typeof Flame; tone: string; bar: string }[] = [
    { status: "PENDING", label: "Incoming", icon: ClipboardList, tone: "bg-orange-50 text-orange-600", bar: "bg-orange-500" },
    { status: "PREPARING", label: "In Progress", icon: Flame, tone: "bg-amber-50 text-amber-600", bar: "bg-amber-400" },
    { status: "READY", label: "Ready to Serve", icon: CircleCheck, tone: "bg-green-50 text-green-600", bar: "bg-green-600" },
    { status: "SERVED", label: "Completed", icon: UtensilsCrossed, tone: "bg-slate-100 text-slate-600", bar: "bg-slate-400" },
];

const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

const hourLabel = (hour: number) => `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;

export default function FineDiningOverview() {
    const board = useTableBoard();
    const { data: menuResponse } = MenuAndOrdersApi.useGetMenuCategories();
    const tickets = {
        PENDING: MenuAndOrdersApi.useGetKitchenTickets("PENDING").data?.data ?? [],
        PREPARING: MenuAndOrdersApi.useGetKitchenTickets("PREPARING").data?.data ?? [],
        READY: MenuAndOrdersApi.useGetKitchenTickets("READY").data?.data ?? [],
        SERVED: MenuAndOrdersApi.useGetKitchenTickets("SERVED").data?.data ?? [],
    };

    const todayOrders = useMemo(() => board.orders.filter((order) => isToday(order.createdAt)), [board.orders]);

    const stats = useMemo(() => {
        const revenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const collected = todayOrders
            .filter((order) => order.payment_status === "PAID")
            .reduce((sum, order) => sum + Number(order.total_amount), 0);
        const guests = todayOrders.reduce((sum, order) => sum + (order.guest_count || 0), 0);
        return {
            revenue,
            collected,
            outstanding: revenue - collected,
            avgOrder: todayOrders.length ? revenue / todayOrders.length : 0,
            guests,
        };
    }, [todayOrders]);

    const tableCounts = useMemo(() => {
        const counts: Record<TTableStatus, number> = { AVAILABLE: 0, OCCUPIED: 0, PENDING: 0, RESERVED: 0 };
        board.tables.forEach((table) => counts[board.statusForTable(table.id)]++);
        return counts;
        // statusForTable is derived from the same queries as tables and orders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [board.tables, board.activeOrders]);
    const inUse = tableCounts.OCCUPIED + tableCounts.PENDING;
    const occupancy = board.tables.length ? Math.round((inUse / board.tables.length) * 100) : 0;

    const ordersByHour = useMemo(() => {
        const hours = todayOrders.map((order) => new Date(order.createdAt).getHours());
        const first = Math.min(8, ...hours);
        const last = Math.max(new Date().getHours(), ...hours);
        return Array.from({ length: last - first + 1 }, (_, i) => {
            const hour = first + i;
            return { hour: hourLabel(hour), orders: hours.filter((h) => h === hour).length };
        });
    }, [todayOrders]);

    const topItems = useMemo(() => {
        const totals = new Map<string, { name: string; quantity: number; revenue: number }>();
        todayOrders.flatMap((order) => order.items).forEach((item) => {
            const entry = totals.get(item.menu_item.id) ?? { name: item.menu_item.name, quantity: 0, revenue: 0 };
            entry.quantity += item.quantity;
            entry.revenue += Number(item.menu_item.price) * item.quantity;
            totals.set(item.menu_item.id, entry);
        });
        return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [todayOrders]);

    const lowStock = useMemo(() =>
        (menuResponse?.data ?? [])
            .flatMap((category) => category.items)
            .filter((item) => item.stock_quantity <= LOW_STOCK_THRESHOLD)
            .sort((a, b) => a.stock_quantity - b.stock_quantity)
            .slice(0, 5),
        [menuResponse]);

    const delayedTickets = [...tickets.PENDING, ...tickets.PREPARING]
        .map((ticket) => ({ ticket, waited: minutesSince(ticket.items[0]?.createdAt ?? new Date()) }))
        .filter(({ waited }) => waited >= TARGET_PREP_MINUTES)
        .sort((a, b) => b.waited - a.waited)
        .slice(0, 4);

    const pipelineTotal = PIPELINE.reduce((sum, stage) => sum + tickets[stage.status].length, 0);

    if (board.isLoading) {
        return (
            <div className="my-8 flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                loading service overview . . .
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
                {[
                    { href: "/menu/orders", label: "Place Order", icon: Receipt, primary: true },
                    { href: "/menu/kitchen", label: "Kitchen Board", icon: ChefHat },
                    { href: "/menu/waiters", label: "Floor & Waiters", icon: LayoutGrid },
                    { href: "/table-management", label: "Reservations", icon: UsersRound },
                ].map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold transition-colors ${action.primary
                            ? "bg-orange-600 text-white hover:bg-orange-700"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600"
                            }`}
                    >
                        <action.icon size={16} />
                        {action.label}
                    </Link>
                ))}
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-4 lg:grid-cols-2 sm:grid-cols-1 gap-4">
                <KpiTile
                    icon={Banknote}
                    tone="bg-orange-50 text-orange-600"
                    label="Today's Sales"
                    value={formatNaira(stats.revenue)}
                    detail={`${formatNaira(stats.collected)} collected`}
                />
                <KpiTile
                    icon={Receipt}
                    tone="bg-blue-50 text-blue-600"
                    label="Orders Today"
                    value={todayOrders.length.toLocaleString()}
                    detail={`${board.activeOrders.length} open · ${stats.guests} guests`}
                />
                <KpiTile
                    icon={Wallet}
                    tone="bg-green-50 text-green-600"
                    label="Average Order"
                    value={formatNaira(Math.round(stats.avgOrder))}
                    detail={`${formatNaira(stats.outstanding)} awaiting payment`}
                />
                <KpiTile
                    icon={LayoutGrid}
                    tone="bg-purple-50 text-purple-600"
                    label="Table Occupancy"
                    value={`${occupancy}%`}
                    detail={`${inUse} of ${board.tables.length} tables in use`}
                    progress={occupancy}
                />
            </div>

            {/* Kitchen pipeline + delays */}
            <div className="grid grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-1 gap-5">
                <Panel title="Kitchen Pipeline" subtitle="Live ticket flow from order to table" href="/menu/kitchen">
                    <div className="grid grid-cols-4 md:grid-cols-2 gap-3">
                        {PIPELINE.map((stage) => (
                            <div key={stage.status} className="border border-gray-100 rounded-[10px] p-3">
                                <div className={`h-8 w-8 rounded-[8px] flex items-center justify-center ${stage.tone}`}>
                                    <stage.icon size={16} />
                                </div>
                                <p className="text-2xl font-extrabold text-gray-900 mt-3">{tickets[stage.status].length}</p>
                                <p className="text-xs font-medium text-gray-500">{stage.label}</p>
                            </div>
                        ))}
                    </div>

                    {pipelineTotal > 0 && (
                        <div className="mt-4">
                            <div className="flex h-2 rounded-full overflow-hidden gap-[2px] bg-white">
                                {PIPELINE.filter((stage) => tickets[stage.status].length).map((stage) => (
                                    <div
                                        key={stage.status}
                                        title={`${stage.label}: ${tickets[stage.status].length}`}
                                        className={stage.bar}
                                        style={{ width: `${(tickets[stage.status].length / pipelineTotal) * 100}%` }}
                                    />
                                ))}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">{pipelineTotal} tickets on the board</p>
                        </div>
                    )}
                </Panel>

                <Panel title="Needs Attention" subtitle={`Tickets waiting over ${TARGET_PREP_MINUTES} mins`}>
                    {delayedTickets.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-[10px] p-3">
                            <CircleCheck size={16} /> Kitchen is on schedule
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {delayedTickets.map(({ ticket, waited }) => (
                                <li key={ticket.order_id} className="flex items-center justify-between gap-3 border border-red-100 bg-red-50/50 rounded-[10px] px-3 py-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <AlertTriangle size={14} className="text-red-600 shrink-0" />
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {orderCode(ticket.order_id)} · {tableLabel(board.tables, ticket.table_id)}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-red-600 whitespace-nowrap">{waited} min</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            {/* Orders by hour + floor */}
            <div className="grid grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-1 gap-5">
                <Panel title="Orders by Hour" subtitle="Today's service rhythm">
                    {todayOrders.length === 0 ? (
                        <EmptyNote icon={Clock} text="No orders yet today. The chart fills in as orders come in." />
                    ) : (
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ordersByHour} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                                    <Tooltip
                                        cursor={{ fill: "#FFF7ED" }}
                                        contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                                        formatter={(value) => [value, "Orders"]}
                                    />
                                    <Bar dataKey="orders" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Panel>

                <Panel title="Floor Status" subtitle={`${board.tables.length} tables`} href="/menu/waiters">
                    {board.tables.length === 0 ? (
                        <EmptyNote icon={LayoutGrid} text="No tables set up yet." />
                    ) : (
                        <>
                            <div className="grid grid-cols-5 gap-2">
                                {board.tables.slice(0, 20).map((table) => {
                                    const style = TABLE_STATUS_STYLES[board.statusForTable(table.id)];
                                    return (
                                        <div
                                            key={table.id}
                                            title={`${table.label} · ${style.label}`}
                                            className={`border rounded-[8px] py-2 text-center text-xs font-bold ${style.card} ${style.text}`}
                                        >
                                            {table.label}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {(Object.keys(TABLE_STATUS_STYLES) as TTableStatus[]).map((status) => (
                                    <div key={status} className="flex items-center justify-between text-xs">
                                        <span className={`font-semibold ${TABLE_STATUS_STYLES[status].text}`}>{TABLE_STATUS_STYLES[status].label}</span>
                                        <span className="font-bold text-gray-800">{tableCounts[status]}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Panel>
            </div>

            {/* Top items + low stock */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-5">
                <Panel title="Top Selling Today" subtitle="By quantity ordered">
                    {topItems.length === 0 ? (
                        <EmptyNote icon={UtensilsCrossed} text="Best sellers appear after the first orders." />
                    ) : (
                        <ul className="space-y-3">
                            {topItems.map((item, index) => (
                                <li key={item.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-800">
                                            <span className="text-gray-400 mr-2">{index + 1}</span>{item.name}
                                        </span>
                                        <span className="text-gray-500">
                                            <span className="font-bold text-gray-800">{item.quantity}</span> · {formatNaira(item.revenue)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${(item.quantity / topItems[0].quantity) * 100}%`, backgroundColor: CHART_COLOR }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Low Stock" subtitle={`${LOW_STOCK_THRESHOLD} or fewer left`} href="/menu/stock">
                    {lowStock.length === 0 ? (
                        <EmptyNote icon={CircleCheck} text="All menu items are well stocked." />
                    ) : (
                        <ul className="divide-y">
                            {lowStock.map((item) => (
                                <li key={item.id} className="flex items-center justify-between py-2.5">
                                    <div className="flex items-center gap-2">
                                        {item.stock_quantity === 0
                                            ? <PackageX size={15} className="text-red-600" />
                                            : <Timer size={15} className="text-amber-600" />}
                                        <span className="text-sm text-gray-800">{item.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.stock_quantity === 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                                        {item.stock_quantity === 0 ? "Sold out" : `${item.stock_quantity} ${item.unit_type.toLowerCase()}(s) left`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            <OrdersTable title="Recent Orders" orders={board.orders} tables={board.tables} />
        </div>
    );
}

interface IKpiTileProps {
    icon: typeof Flame;
    tone: string;
    label: string;
    value: string;
    detail: string;
    progress?: number;
}

const KpiTile = ({ icon: Icon, tone, label, value, detail, progress }: IKpiTileProps) => (
    <div className="bg-white border border-gray-200 rounded-[12px] p-4">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center ${tone}`}>
                <Icon size={18} />
            </div>
        </div>
        <p className="text-2xl font-extrabold text-gray-900 mt-2">{value}</p>
        {progress !== undefined && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
        )}
        <p className="text-xs text-gray-500 mt-2">{detail}</p>
    </div>
);

const Panel = ({ title, subtitle, href, children }: { title: string; subtitle?: string; href?: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-[12px] p-5 md:p-4 min-w-0">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-base font-bold text-gray-800">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
            {href && (
                <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                    Open <ArrowRight size={12} />
                </Link>
            )}
        </div>
        {children}
    </div>
);

const EmptyNote = ({ icon: Icon, text }: { icon: typeof Flame; text: string }) => (
    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-[10px] p-4">
        <Icon size={16} className="text-gray-400" /> {text}
    </div>
);
