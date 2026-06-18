/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { Ban, Loader2, Plus, Trash2, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import Image from "next/image";
import PaymentModal from "./PaymentModal";
import { useEffect, useState } from "react";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { MenuCategoryResponse } from "@/types/fine-din-menu-orders-types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionInformationApi } from "@/services/api/business-transaction-info-api";
import { TransactionInformationType } from "@/types/transaction-info-types";

type TMenuItem = MenuCategoryResponse[number]['items'][number]

type TCartItem = {
    item: TMenuItem;
    quantity: number;
};

const PlaceOrder = () => {

    const { data: menuCategoryResponse, isLoading } = MenuAndOrdersApi.useGetMenuCategories();
    const menuCategoryRaw = menuCategoryResponse?.data;
    const menuCategoryList = [...(menuCategoryRaw || [])].reverse();

    const [activeCategoryId, setActiveCategoryId] = useState("");

    useEffect(() => {
        if (menuCategoryList?.length && !activeCategoryId) {
            setActiveCategoryId(menuCategoryList[0].id);
        }
    }, [menuCategoryList]);

    const activeCategory = menuCategoryList?.find((c) => c.id === activeCategoryId);
    const [cart, setCart] = useState<Record<string, TCartItem>>({});

    const addToCart = (item: TMenuItem) => {
        setCart((prev) => {
            const existing = prev[item.id];

            return {
                ...prev,
                [item.id]: {
                    item,
                    quantity: existing ? existing.quantity + 1 : 1
                }
            };
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => {
            const existing = prev[itemId];

            if (!existing) return prev;

            if (existing.quantity === 1) {
                const copy = { ...prev };
                delete copy[itemId];
                return copy;
            }

            return {
                ...prev,
                [itemId]: {
                    ...existing,
                    quantity: existing.quantity - 1
                }
            };
        });
    };

    const [openCheckout, setOpenCheckout] = useState(false);

    const totalCartItems = Object.values(cart).reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const resetCart = () => {
        setCart({});
    };

    return (
        <div>
            {isLoading ?
                <div className='my-5 flex items-center gap-2'>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    loading . . .
                </div>
                :
                <>
                    <div className="min-h-screen space-y-6">

                        {/* --- CATEGORY TAB --- */}
                        <Tabs defaultValue="Soups" value={activeCategoryId} onValueChange={setActiveCategoryId}>
                            <TabsList className="bg-transparent h-auto p-0 flex-wrap">
                                {menuCategoryList?.map((cat) => (
                                    <TabsTrigger
                                        key={cat.id}
                                        value={cat.id}
                                        className="rounded-none first:rounded-l-[5px] last:rounded-r-[5px] px-3 py-1.5 text-sm border border-gray-200 border-r-transparent last:border-r-gray-200 bg-white data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none text-gray-500 font-medium transition-all"
                                    >
                                        {cat.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-2">
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-[20px] font-bold text-[#5F5E5E]">{activeCategory?.name}</h2>
                                    <span className="text-[#4D4635] text-xs font-medium">{activeCategory?.items.length} Items</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-3">

                                {activeCategory?.items.length === 0 ?
                                    <p className='text-[15px]'>No Items under this category</p>
                                    :
                                    activeCategory?.items.map((item) => (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            quantity={cart[item.id]?.quantity ?? 0}
                                            onAdd={() => addToCart(item)}
                                            onRemove={() => removeFromCart(item.id)}
                                        />)
                                    )}

                            </div>
                        </div>

                    </div>

                    {/* FLOATING BUTTON */}
                    <button
                        // disabled={totalCartItems === 0}
                        onClick={() => setOpenCheckout(true)}
                        className={`fixed bottom-6 right-6 z-40 px-4 py-2 rounded-[10px] text-sm shadow-xl flex items-center gap-3 ${totalCartItems === 0
                            ? "bg-gray-300 text-gray-600 cursor-default"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                            }`}
                    >
                        <span className="font-semibold">View</span>

                        <div className="h-5 min-w-5 px-2 rounded-full bg-white text-orange-500 text-[13px] flex items-center justify-center font-bold">
                            {totalCartItems}
                        </div>
                    </button>

                    {
                        openCheckout && (
                            <div onClick={() => setOpenCheckout(false)} className="fixed inset-0 z-50 flex justify-end pr-2 pt-[2dvh] bg-black/30">
                                <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md h-[96dvh] rounded-[10px] bg-white p-4 overflow-y-auto shadow-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold">Order Details</h2>

                                        <button
                                            onClick={() => setOpenCheckout(false)}
                                            className="text-sm text-gray-500 hover:text-black"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <CheckoutCard
                                        cart={cart}
                                        onResetCart={resetCart}
                                        onClose={() => setOpenCheckout(false)}
                                    />
                                </div>
                            </div>
                        )
                    }
                </>}
        </div>
    )
}

interface IMenuItemCardProps {
    item: TMenuItem;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
}

const MenuItemCard = ({ item, quantity, onAdd, onRemove }: IMenuItemCardProps) => (
    <Card className="rounded-[15px] overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow p-3">
        <div className="relative h-44">
            <Image
                width={120}
                height={120}
                src={item.image_url}
                alt={item.name}
                className={`w-full h-full object-cover rounded-[10px] ${item.stock_quantity < 1 ? 'grayscale' : ''}`}
            />
            {item.stock_quantity < 1 && (
                <div className="absolute rounded-[10px] inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-md tracking-widest">NOT AVAILABLE</span>
                </div>
            )}
        </div>
        <CardContent className="py-4 pb-0 space-y-3 px-0">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#5F5E5E] leading-tight flex-1 pr-2">{item.name}</h3>
                {item.stock_quantity < 1 ? (
                    <Ban className="text-gray-300 h-5 w-5" />
                ) : (
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 scale-90 origin-right">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={onRemove}
                        >
                            <Trash2 size={14} />
                        </Button>

                        <span className="px-3 font-bold text-sm">
                            {quantity}
                        </span>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={onAdd}
                        >
                            <Plus size={14} />
                        </Button>
                    </div>
                )}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{item.description}</p>
            <p className="text-orange-600 font-bold text-lg">NGN {Number(item.price).toLocaleString()}</p> <span className="text-[13px] text-gray-700 font-medium">{item.stock_quantity} {item.unit_type.toLocaleLowerCase()}(s) left</span>
        </CardContent>
    </Card>
)

const CheckoutCard = ({
    cart,
    onClose,
    onResetCart
}: {
    cart: Record<string, TCartItem>;
    onClose: () => void;
    onResetCart: () => void;
}) => {

    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [showCheckoutForm, setShowCheckoutForm] = useState(false);

    const [waiterName, setWaiterName] = useState("");
    const [guestCount, setGuestCount] = useState("");

    const items = Object.values(cart);

    const subtotal = items.reduce(
        (sum, entry) => sum + Number(entry.item.price) * entry.quantity,
        0
    );

    const createOrderMutation = MenuAndOrdersApi.useCreateOrder();
    const queryClient = useQueryClient();

    const {
        data: chargesData,
        isLoading
    } = TransactionInformationApi.useGetBusinessCharges();

    const vatCharge = chargesData?.data.find(c => c.type === TransactionInformationType.VAT);
    const serviceCharge = chargesData?.data.find(c => c.type === TransactionInformationType.SERVICE_CHARGE);

    const service = subtotal * (!serviceCharge?.isActive ? 0 : serviceCharge.percentage) / 100;
    const vat = subtotal * (!vatCharge?.isActive ? 0 : vatCharge.percentage) / 100;
    const total = subtotal + service + vat;

    const handleSendToKitchen = () => {
        const payload = {
            waiter_name: waiterName,
            guest_count: Number(guestCount),
            items: Object.values(cart).map((entry) => ({
                menu_item_id: entry.item.id,
                quantity: entry.quantity,
                special_notes: ""
            }))
        };

        console.log(payload);

        createOrderMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Order created and sent to kitchen.');

                setShowCheckoutForm(false);
                setWaiterName('');
                setGuestCount('');

                setTimeout(() => {
                    onResetCart();
                }, 300);
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'categories']
                })
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'orders']
                })
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'kitchen-tickets']
                })
                onClose();
            }
        })
    };

    return (
        <Card className="rounded-[10px] border border-[#CEDCFB] bg-blue-50/50 p-4 shadow-none space-y-4">

            <div className="space-y-3 border-b pb-4">
                <h3 className="font-semibold text-[13px] text-slate-500">ITEMS</h3>
                {items.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No items added yet
                    </p>
                ) : (
                    items.map((entry) => (
                        <div
                            key={entry.item.id}
                            className="flex justify-between items-start pb-"
                        >
                            <div className="flex items-center gap-2">
                                <h3 className="font-medium text-[15px]">
                                    {entry.item.name}
                                </h3>

                                <p className="text-[13px] text-gray-500">
                                    Qty: {entry.quantity}
                                </p>
                            </div>

                            <p className="font-bold text-base text-orange-600">
                                ₦
                                {(
                                    Number(entry.item.price) * entry.quantity
                                ).toLocaleString()}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {isLoading ?
                <div className='col-span-full my-2 flex items-center gap-2'>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    loading charges . . .
                </div>
                :
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Subtotal</span>
                        <span className="text-slate-900 text-[15px]">₦ {subtotal.toLocaleString()}</span>
                    </div>
                    {serviceCharge?.isActive &&
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Service ({serviceCharge?.percentage}%)</span>
                            <span className="text-slate-900 text-[15px]">₦{service.toLocaleString()}</span>
                        </div>
                    }
                    {vatCharge?.isActive &&
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">VAT ({vatCharge?.percentage}%)</span>
                            <span className="text-slate-900 text-[15px]">₦{vat.toLocaleString()}</span>
                        </div>
                    }
                </div>}

            <Separator className="bg-blue-100" />

            <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm ">Total</span>
                <span className="text-orange-600 text-lg font-bold">₦{total.toLocaleString()}</span>
            </div>

            <div className="space-y-3">

                {!showCheckoutForm ? (
                    <>
                        <Button
                            onClick={() => setShowCheckoutForm(true)}
                            disabled={items.length === 0}
                            className="w-full h-10 text-sm bg-[#F05523] disabled:bg-gray-400 disabled:cursor-not-allowed! hover:bg-[#d9441a] text-white font-semibold rounded-[5px] shadow-none"
                        >
                            Continue
                        </Button>
                        <Button
                            onClick={() => setShowCheckoutForm(true)}
                            disabled={items.length === 0}
                            className="w-full h-10 text-sm bg-white hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed! text-slate-700 border border-gray-500 font-semibold rounded-[5px] shadow-none"
                        >
                            Clear cart
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-1">
                            <input
                                type="text"
                                placeholder="Waiter Name"
                                value={waiterName}
                                onChange={(e) => setWaiterName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 h-10 outline-none text-sm"
                            />

                            <input
                                type="number"
                                placeholder="Number of Guests"
                                value={guestCount}
                                onChange={(e) => setGuestCount(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 h-10 outline-none text-sm"
                            />
                        </div>

                        <Button
                            onClick={handleSendToKitchen}
                            disabled={createOrderMutation.isPending}
                            className="w-full h-10 text-sm bg-[#F05523] hover:bg-[#d9441a] disabled:opacity-60 disabled:cursor-not-allowed! text-white font-semibold border border-gray-300 shadow-none rounded-[5px]"
                        >
                            {createOrderMutation.isPending ? 'sending . . .' : 'Send to Kitchen'}
                        </Button>

                        <Button
                            onClick={() => setOpenPaymentModal(true)}
                            className="hidden w-full h-10 text-sm bg-[#F05523] hover:bg-[#d9441a] text-white font-semibold rounded-[5px] shadow-none"
                        >
                            Proceed to Payment
                        </Button>
                    </>
                )}
            </div>
            <PaymentModal
                isOpen={openPaymentModal}
                onClose={() => setOpenPaymentModal(false)}
            />
        </Card>
    )
}

export default PlaceOrder