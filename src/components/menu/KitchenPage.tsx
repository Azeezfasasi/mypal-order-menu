"use client";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Header from "./Header";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { IKitchenTicketList } from "@/types/fine-din-menu-orders-types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

export default function KitchenPage() {

    const { data: pendingKitchenTicketResponse, isLoading: isLoadingPending } = MenuAndOrdersApi.useGetKitchenTickets('PENDING');
    const pendingKitchenList = pendingKitchenTicketResponse?.data;

    const { data: preparingKitchenTicketResponse, isLoading: isLoadingPreparing } = MenuAndOrdersApi.useGetKitchenTickets('PREPARING');
    const preparingKitchenList = preparingKitchenTicketResponse?.data;

    const { data: readyKitchenTicketResponse, isLoading: isLoadingReady } = MenuAndOrdersApi.useGetKitchenTickets('READY');
    const readyKitchenList = readyKitchenTicketResponse?.data;

    const { data: servedKitchenTicketResponse, isLoading: isLoadingServed } = MenuAndOrdersApi.useGetKitchenTickets('SERVED');
    const servedKitchenList = servedKitchenTicketResponse?.data;

    const pendingTicketRef = useRef<HTMLDivElement>(null);
    const preparingTicketRef = useRef<HTMLDivElement>(null);
    const readyTicketRef = useRef<HTMLDivElement>(null);
    const servedTicketRef = useRef<HTMLDivElement>(null);

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
        if (ref.current) {
            const scrollAmount = 300;
            ref.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="space-y-6">
            <Header />

            {/* SECTION: PENDING TICKETS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Pending Tickets</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => scroll(pendingTicketRef, "left")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={() => scroll(pendingTicketRef, "right")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div
                    ref={pendingTicketRef}
                    // className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4"
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x"
                    style={{ scrollbarWidth: "none" }}
                >
                    {isLoadingPending ?
                        <div className='col-span-full my-2 flex items-center gap-2'>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            loading tickets . . .
                        </div>
                        :
                        !pendingKitchenList || (pendingKitchenList && pendingKitchenList.length === 0) ?
                            <p className='text-[15px] col-span-full font-medium'>No Kitchen Tickets</p>
                            :
                            pendingKitchenList?.map((ticket) => (
                                <div key={ticket.order_id} className="">
                                    <KdsCard ticket={ticket} />
                                </div>
                            ))}
                </div>
            </div>

            {/* SECTION: PREPARING TICKETS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Preparing Tickets</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => scroll(preparingTicketRef, "left")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={() => scroll(preparingTicketRef, "right")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div
                    ref={preparingTicketRef}
                    // className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4"
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x"
                    style={{ scrollbarWidth: "none" }}
                >
                    {isLoadingPreparing ?
                        <div className='col-span-full my-2 flex items-center gap-2'>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            loading tickets . . .
                        </div>
                        :
                        !preparingKitchenList || (preparingKitchenList && preparingKitchenList.length === 0) ?
                            <p className='text-[15px] col-span-full font-medium'>No Kitchen Tickets</p>
                            :
                            preparingKitchenList?.map((ticket) => (
                                <div key={ticket.order_id} className="">
                                    <KdsCard ticket={ticket} />
                                </div>
                            ))}
                </div>
            </div>

            {/* SECTION: READY TICKETS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Ready Tickets</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => scroll(readyTicketRef, "left")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={() => scroll(readyTicketRef, "right")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div
                    ref={readyTicketRef}
                    // className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4"
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x"
                    style={{ scrollbarWidth: "none" }}
                >
                    {isLoadingReady ?
                        <div className='col-span-full my-2 flex items-center gap-2'>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            loading tickets . . .
                        </div>
                        :
                        !readyKitchenList || (readyKitchenList && readyKitchenList.length === 0) ?
                            <p className='text-[15px] col-span-full font-medium'>No Kitchen Tickets</p>
                            :
                            readyKitchenList?.map((ticket) => (
                                <div key={ticket.order_id} className="">
                                    <KdsCard ticket={ticket} />
                                </div>
                            ))}
                </div>
            </div>

            {/* SECTION: SERVED TICKETS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Served Tickets</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => scroll(servedTicketRef, "left")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={() => scroll(servedTicketRef, "right")} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div
                    ref={servedTicketRef}
                    // className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4"
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x"
                    style={{ scrollbarWidth: "none" }}
                >
                    {isLoadingServed ?
                        <div className='col-span-full my-2 flex items-center gap-2'>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            loading tickets . . .
                        </div>
                        :
                        !servedKitchenList || (servedKitchenList && servedKitchenList.length === 0) ?
                            <p className='text-[15px] col-span-full font-medium'>No Kitchen Tickets</p>
                            :
                            servedKitchenList?.map((ticket) => (
                                <div key={ticket.order_id} className="">
                                    <KdsCard ticket={ticket} />
                                </div>
                            ))}
                </div>
            </div>
        </div>
    );
}

// --- CHILD CARD COMPONENT ---
interface KdsCardProps {
    ticket: IKitchenTicketList[number];
}

function KdsCard({ ticket }: KdsCardProps) {

    const updateKitchenTicketMutation =
        MenuAndOrdersApi.useUpdateKitchenTicketStatus();

    const queryClient = useQueryClient();

    const handleUpdateItemStatus = ({
        itemId,
        status
    }: {
        itemId: string;
        status: "PREPARING" | "READY" | "SERVED";
    }) => {

        updateKitchenTicketMutation.mutate({
            id: itemId,
            payload: {
                status
            }
        }, {
            onSuccess: () => {
                toast.success("Item updated!");

                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", "kitchen-tickets"]
                });
            }
        });
    };

    return (
        <div
            className="w-[300px] bg-white rounded-[7px] overflow-hidden border border-gray-300 flex flex-col max-h-[420px]"
        >

            {/* Header */}
            <div className="bg-[#F3F4F6] p-4 shrink-0">

                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] tracking-wider font-bold text-gray-400 uppercase">LIVE TICKET</p>
                    <span className="whitespace-nowrap text-xs font-bold text-orange-600">
                        {new Date(
                            ticket.items[0]?.createdAt
                        ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                        })}
                    </span>
                </div>

                <div className="flex justify-between items-baseline gap-1 mt-0.5 mb-2">

                    <h3 className="text-base font-black text-gray-700">
                        {ticket.table_id
                            ? `Table - ${ticket.table_id}`
                            : `Order Id - ${ticket.order_id}`
                        }
                    </h3>
                </div>

                <div className="flex justify-between items-center text-[11px] text-gray-400 font-medium mt-1">

                    <span>
                        WAITER: {ticket.waiter_name}
                    </span>

                    <span>
                        {ticket.items.length} Items
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">

                {ticket.items.map((item) => {

                    const isPending =
                        item.kitchen_status === "PENDING";

                    const isPreparing =
                        item.kitchen_status === "PREPARING";

                    const isReady =
                        item.kitchen_status === "READY";

                    const isServed =
                        item.kitchen_status === "SERVED";

                    return (
                        <div
                            key={item.id}
                            className="border border-gray-100 rounded-[10px] p-3"
                        >

                            <div className="flex items-start justify-between gap-3">

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">

                                        <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${isPending
                                                ? "bg-gray-400"
                                                : isPreparing
                                                    ? "bg-blue-500"
                                                    : "bg-green-500"
                                                }`}
                                        />

                                        <p
                                            className={`font-bold text-sm ${isServed
                                                ? "line-through text-gray-500"
                                                : "text-gray-800"
                                                }`}
                                        >
                                            {item.menu_item.name}
                                        </p>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-1 pl-4">
                                        Qty: {item.quantity}
                                    </p>

                                    {item.special_notes && (
                                        <div className="flex items-center gap-1 pl-4 mt-1 text-[10px] font-bold text-red-600">

                                            <AlertTriangle className="h-3 w-3 fill-red-50 stroke-red-600" />

                                            <span>
                                                {item.special_notes}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Status pill */}
                                <span
                                    className={`text-[9px] font-bold tracking-wide px-2 py-1 rounded-full uppercase shrink-0 ${isPending
                                        ? "bg-gray-100 text-gray-500"
                                        : isPreparing
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-green-50 text-green-600"
                                        }`}
                                >
                                    {item.kitchen_status}
                                </span>
                            </div>

                            {/* Per-item action buttons */}
                            <div className="mt-3">

                                {isPending && (
                                    <button
                                        onClick={() =>
                                            handleUpdateItemStatus({
                                                itemId: item.id,
                                                status: "PREPARING"
                                            })
                                        }
                                        disabled={
                                            updateKitchenTicketMutation.isPending
                                        }
                                        className="w-full bg-[#D93F0B] hover:bg-[#b83206] disabled:opacity-60 text-white font-bold text-[11px] py-2 rounded-[5px] uppercase tracking-wider transition-colors"
                                    >
                                        Mark Preparing
                                    </button>
                                )}

                                {isPreparing && (
                                    <button
                                        onClick={() =>
                                            handleUpdateItemStatus({
                                                itemId: item.id,
                                                status: "READY"
                                            })
                                        }
                                        disabled={
                                            updateKitchenTicketMutation.isPending
                                        }
                                        className="w-full bg-[#1D4ED8] hover:bg-[#1e40af] disabled:opacity-60 text-white font-bold text-[11px] py-2 rounded-[5px] uppercase tracking-wider transition-colors"
                                    >
                                        Mark Ready
                                    </button>
                                )}

                                {isReady && (
                                    <button
                                        onClick={() =>
                                            handleUpdateItemStatus({
                                                itemId: item.id,
                                                status: "SERVED"
                                            })
                                        }
                                        disabled={
                                            updateKitchenTicketMutation.isPending
                                        }
                                        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold text-[11px] py-2 rounded-[5px] uppercase tracking-wider transition-colors"
                                    >
                                        Mark Served
                                    </button>
                                )}

                                {isServed && (
                                    <div className="w-full border border-green-200 bg-green-50 text-green-600 font-bold text-[11px] py-2 rounded-[5px] uppercase tracking-wider text-center">
                                        Served
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}