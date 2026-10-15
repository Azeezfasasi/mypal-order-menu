import React, { useState } from "react";
import {
    Copy,
    User,
    Handshake,
    Truck,
    Wallet,
    Calendar,
    CheckCircle2,
    ShoppingBag,
    LucideProps
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GetBusinessOrderResponse } from "@/services/api/business-overview-and-revenue-api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { DialogTitle } from "@radix-ui/react-dialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { BusinessCategoryType } from "@/types/enums";
import { normalizeOrderItemAddons } from "@/lib/order-addons";
import { OrderItemAddonList } from "@/components/order-item-addon-list";

interface OrderDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderDetails?: GetBusinessOrderResponse['data']
}

export default function OrderDetailModal({ open, onOpenChange, orderDetails }: OrderDetailModalProps) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // --- to get the business category ---
    const business = useAuthStore((state) => state.business);
    const [selectedBusinessType,] = useState(
        business?.category?.business_type,
    );

    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete('category');
        params.delete('orderId');

        const query = params.toString();

        router.replace(query ? `${pathname}?${query}` : pathname);

        onOpenChange(false);
    };

    if (!orderDetails) return;

    return (
        <Dialog open={open} onOpenChange={(value) => {
            if (!value) {
                handleClose();
                return;
            }

            onOpenChange(value);
        }}>
            <DialogContent className="max-w-[500px] max-h-[95dvh] p-0 sm:p-2 overflow-y-auto border-none rounded-[8px] gap-0">
                <DialogTitle className="hidden">title</DialogTitle>
                <DialogHeader className="p-6 sm:p-3 pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage alt="Amarachi Okoro" />
                                    <AvatarFallback className="font-bold">
                                        {orderDetails.address.full_name?.charAt(0) ?? 'N/A'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-0.5">
                                    <CheckCircle2 className="h-4 w-4 fill-blue-500 text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col text-left">
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{orderDetails.address.full_name ?? 'N/A'}</h3>
                                <p className="text-slate-500 text-sm">{orderDetails.address.phone_number ?? '- -'}</p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 sm:px-3 py-2 space-y-0 relative">
                    <div className="absolute left-6 right-6 top-0 h-[1px] bg-slate-100" />

                    <DetailItem
                        icon={User}
                        label="Order ID"
                        value={orderDetails?.id}
                        copyable
                    />
                    <DetailItem
                        icon={Handshake}
                        label="Order status"
                        value={orderDetails?.status}
                        copyable
                    />
                    <DetailItem
                        icon={Handshake}
                        label="Order method"
                        value={orderDetails?.order_method}
                        copyable
                    />
                    <DetailItem
                        icon={Handshake}
                        label="Delivery Price"
                        value={`₦${orderDetails?.delivery?.delivery_price?.toLocaleString() ?? '0'}`}
                        copyable
                    />
                    <DetailItem
                        icon={Truck}
                        label="Delivery service"
                        value={orderDetails?.delivery_service}
                        copyable
                    />
                    {selectedBusinessType === BusinessCategoryType.ICONICDELICACIES &&
                        <DetailItem
                            icon={Truck}
                            label="Pick up OTP"
                            value={orderDetails?.delivery?.pickup_otp ?? '- -'}
                            copyable
                        />
                    }
                    <DetailItem
                        icon={Wallet}
                        label="Amount"
                        value={`₦${orderDetails?.amount?.toLocaleString()}`}
                        valueClassName="text-[#e44a16]"
                        copyable
                    />
                    <DetailItem
                        icon={Calendar}
                        label="Order date"
                        value={formatDate(orderDetails?.createdAt)}
                    />
                </div>

                {/* Order Items Section */}
                {orderDetails.orderitems?.length > 0 && (
                    <div className="px-6 sm:px-3 pt-4 pb-2">
                        <div className="h-[1px] bg-slate-100 mb-4" />
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag className="h-4 w-4 text-slate-600" />
                            <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
                                Order Items
                            </span>
                            <span className="ml-auto text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                                {orderDetails.orderitems.length}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {orderDetails.orderitems.map((orderItem) => (
                                <OrderItemRow key={orderItem.id} orderItem={orderItem} />
                            ))}
                        </div>

                        {/* Items subtotal */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <span className="text-sm font-medium text-slate-500">Subtotal</span>
                            <span className="text-sm font-bold text-slate-900">
                                ₦{orderDetails.orderitems
                                    .reduce((sum, item) => sum + item.amount, 0)
                                    .toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                <div className="p-4 pt-3">
                    <Button onClick={handleClose} className="w-full bg-[#e44a16] hover:bg-[#c33d12] text-white h-12 rounded-xl text-base font-bold transition-all shadow-lg shadow-orange-100">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

type OrderItem = GetBusinessOrderResponse['data']['orderitems'][number];

function OrderItemRow({ orderItem }: { orderItem: OrderItem }) {

    const { item, quantity, amount, quantity_option_label, quantity_option_price } = orderItem;
    const addons = normalizeOrderItemAddons(orderItem.addons);

    const quantityOptionPriceNumber = Number(quantity_option_price);
    const quantityOptionPrice = isNaN(quantityOptionPriceNumber) ? 0 : quantityOptionPriceNumber;

    const imageUrl = item.image_urls?.[0];
    const discountPrice = parseFloat(item.discount_price);
    const hasDiscount = !isNaN(discountPrice) && discountPrice > 0 && discountPrice < quantityOptionPriceNumber;

    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            {/* Item image or fallback */}
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-slate-600" />
                    </div>
                )}
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {hasDiscount ? (
                        <>
                            <span className="text-xs font-medium text-[#e44a16]">₦{discountPrice.toLocaleString()}</span>
                            <span className="text-xs text-slate-600 line-through">₦{quantityOptionPrice?.toLocaleString()}</span>
                        </>
                    ) : (
                        <span className="text-xs font-medium text-slate-500">₦{quantityOptionPrice?.toLocaleString()}</span>
                    )}
                    {quantity_option_label && (
                        <span className="text-xs text-slate-600">· {quantity_option_label}</span>
                    )}
                </div>
                <OrderItemAddonList addons={addons} className="mt-1" />
            </div>

            {/* Quantity & line total */}
            <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-bold text-slate-900">₦{amount.toLocaleString()}</span>
                <span className="text-xs text-slate-600 mt-0.5">
                    x{quantity}
                </span>
            </div>
        </div>
    );
}

function DetailItem({
    icon: Icon,
    label,
    value,
    copyable = false,
    valueClassName = ""
}: {
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    label: string;
    value: string;
    copyable?: boolean;
    valueClassName?: string;
}) {

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success('copied!')
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-none group">
            <div className="flex items-center justify-center w-7">
                <Icon className="text-slate-600 h-4 w-4" />
            </div>
            <div className="flex-1 flex flex-col min-w-0 w-full">
                <span className="text-slate-600 text-xs font-medium mb-0.5">{label}</span>
                <span className={`text-slate-900 font-bold truncate whitespace-nowrap sm:w-[210px] text-base ${valueClassName}`}>{value ?? '- -'}</span>
            </div>
            {copyable && (
                <button onClick={handleCopy} className="p-2 hover:bg-slate-50 rounded-lg transition-colors group-hover:opacity-100">
                    <Copy className="h-4 w-4 text-gray-400" />
                </button>
            )}
        </div>
    );
}