'use client'

import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api"
import { Card } from "@/components/ui/card"
import { IOrdersResponse } from "@/types/fine-din-menu-orders-types";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const ViewOrders = () => {
    const { data, isLoading } = MenuAndOrdersApi.useGetAllOrders();
    const orderList = data?.data;

    return (
        <div className="p-4 sm:px-0 sm:py-2">
            <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
                {isLoading ?
                    <div className='my-2 flex items-center gap-2'>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        loading . . .
                    </div>
                    :
                    !orderList || (orderList && orderList.length === 0) ?
                        <p className='text-[15px] -mt-3'>No orders.</p>
                        :
                        orderList?.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
            </div>
        </div>
    )
}

type TPaymentMethod = "CARD" | "BANK_TRANSFER" | "MOBILE_APP" | ""

export const OrderCard = ({ order }: { order: IOrdersResponse[number] }) => {

    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>("");
    const queryClient = useQueryClient();

    const isPaid = order.payment_status === "PAID";

    const markAsPaidMutation = MenuAndOrdersApi.useMarkOrderAsPaid();

    const handleMarkAsPaid = (orderId: string, paymentMethod: string) => {

        if (!orderId) {
            toast.error('Invalid order Id')
            return;
        }
        if (!paymentMethod) {
            toast.error('Select payment method')
            return;
        }
        markAsPaidMutation.mutate({
            id: orderId,
            payload: {
                payment_method: paymentMethod
            }
        }, {
            onSuccess: () => {
                toast.success('Order marked as paid!');
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'orders']
                })
                setOpenPaymentModal(false);
                setPaymentMethod("");
            }
        })

    }

    return (
        <Card className={`rounded-[10px] border p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition ${isPaid ? "opacity-60" : ""
            }`}>

            <div className="flex flex-col gap-3 ">
                {/* HEADER */}
                <div className="border-b pb-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">
                            Order ID: {order.id}
                        </h3>
                    </div>

                    <p className={`text-[10px] my-2 w-fit font-bold px-2 py-1 rounded-full ${isPaid
                        ? "bg-green-50 text-green-600"
                        : "bg-orange-50 text-orange-600"
                        }`}>
                        {order.payment_status}
                    </p>

                    <div className="text-xs text-gray-500 flex justify-between mb-1">
                        <span>WAITER: {order.waiter_name}</span>
                        <span>{order.guest_count} Guests</span>
                    </div>

                    <div className="text-[11px] font-medium text-gray-700">
                        {new Date(order.createdAt).toLocaleString()}
                    </div>
                </div>

                {/* ITEMS */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                            <div className="space-y-1">
                                <p className="font-medium text-gray-800 leading-tight">
                                    {item.menu_item.name}
                                </p>

                                <p className="text-xs text-gray-400">
                                    Qty: {item.quantity}
                                </p>

                                {item.special_notes && (
                                    <p className="text-[11px] text-red-500">
                                        Note: {item.special_notes}
                                    </p>
                                )}
                            </div>

                            <p className="font-bold text-orange-600">
                                ₦{(Number(item.menu_item.price) * item.quantity).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER */}
            <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Sub-total</span>
                    <span className="font-bold text-gray-700">
                        ₦{Number(order.subtotal).toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">VAT Charge</span>
                    <span className="font-bold text-gray-700">
                        ₦{Number(order.vat_amount).toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Service Charge</span>
                    <span className="font-bold text-gray-700">
                        ₦{Number(order.service_charge_amount).toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3 pb-1">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-orange-600">
                        ₦{Number(order.total_amount).toLocaleString()}
                    </span>
                </div>

                <button
                    onClick={() => {
                        if (isPaid) return;
                        setOpenPaymentModal(true);
                    }}
                    disabled={isPaid}
                    className={`w-full ${isPaid ? 'bg-green-800' : 'bg-gray-900 hover:bg-black'} disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-[6px]`}
                >
                    {isPaid ? <>Paid using {order.payment_method?.replace(/_/g, " ")}</> : 'Mark as Paid'}
                </button>
            </div>

            <Dialog
                open={openPaymentModal}
                onOpenChange={(v) => {
                    setOpenPaymentModal(v);
                    if (!v) setPaymentMethod("");
                }}
            >
                <DialogContent className="">

                    <DialogHeader>
                        <DialogTitle>Select Payment Method</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 py-3">
                        {["CARD", "BANK_TRANSFER"].map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method as TPaymentMethod)}
                                className={`w-full text-sm py-2 rounded-[6px] border font-medium transition ${paymentMethod === method
                                    ? "bg-orange-600 text-white border-orange-600"
                                    : "bg-white text-gray-700 border-gray-300"
                                    }`}
                            >
                                {method.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-col gap-2">
                        <Button
                            disabled={!paymentMethod || markAsPaidMutation.isPending}
                            onClick={() => {
                                handleMarkAsPaid(order.id, paymentMethod)
                            }}
                            className="w-full bg-gray-900 hover:bg-black text-white"
                        >
                            {markAsPaidMutation.isPending ? 'Updating . . .' : 'Confirm Paid Order'}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setOpenPaymentModal(false);
                                setPaymentMethod("");
                            }}
                            className="w-full text-gray-500 border border-gray-300"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default ViewOrders