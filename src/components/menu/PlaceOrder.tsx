/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import {
    Beef, CakeSlice, Coffee, Cookie, Egg, Filter, Loader2, Lock, Minus, Moon, Plus, Salad, Search, Settings2,
    Soup, Sun, UtensilsCrossed, Wine, X, type LucideIcon
} from "lucide-react"
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import Image from "next/image";
import PaymentModal from "./PaymentModal";
import MenuQrPanel from "./MenuQrPanel";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { TableManagementApi } from "@/services/api/table-management-api";
import { MenuCategoryResponse } from "@/types/fine-din-menu-orders-types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionInformationApi } from "@/services/api/business-transaction-info-api";
import { TransactionInformationType } from "@/types/transaction-info-types";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TMenuItem = MenuCategoryResponse[number]['items'][number]

type TCartItem = {
    item: TMenuItem;
    quantity: number;
};

type TSort = "default" | "price-asc" | "price-desc";

const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
    [/soup/i, Soup],
    [/breakfast|egg/i, Egg],
    [/appetizer|starter|salad/i, Salad],
    [/main|grill|meat|steak/i, Beef],
    [/lunch/i, Sun],
    [/dinner/i, Moon],
    [/dessert|cake|pastr/i, CakeSlice],
    [/snack|side/i, Cookie],
    [/wine|cocktail|bar|spirit/i, Wine],
    [/drink|beverage|coffee|tea|juice/i, Coffee],
];

const categoryIcon = (name: string) =>
    CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? UtensilsCrossed;

const PlaceOrder = ({ initialTableId }: { initialTableId?: string }) => {

    const router = useRouter();
    const { data: menuCategoryResponse, isLoading } = MenuAndOrdersApi.useGetMenuCategories();
    const menuCategoryRaw = menuCategoryResponse?.data;
    const menuCategoryList = [...(menuCategoryRaw || [])].reverse();

    const [activeCategoryId, setActiveCategoryId] = useState("");
    const [search, setSearch] = useState("");
    const [availableOnly, setAvailableOnly] = useState(false);
    const [sort, setSort] = useState<TSort>("default");

    useEffect(() => {
        if (menuCategoryList?.length && !activeCategoryId) {
            setActiveCategoryId(menuCategoryList[0].id);
        }
    }, [menuCategoryList]);

    const activeCategory = menuCategoryList?.find((c) => c.id === activeCategoryId);
    const [cart, setCart] = useState<Record<string, TCartItem>>({});
    const [openCheckout, setOpenCheckout] = useState(false);

    useEffect(() => {
        if (initialTableId) {
            toast.info("Add items for this table, then place the order.");
        }
    }, [initialTableId]);

    // Searching looks across every category, otherwise only the selected one
    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        let items = query
            ? menuCategoryList.flatMap((category) => category.items).filter((item) =>
                item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query))
            : activeCategory?.items ?? [];

        if (availableOnly) {
            items = items.filter((item) => item.is_available && item.stock_quantity > 0);
        }
        if (sort !== "default") {
            items = [...items].sort((a, b) =>
                sort === "price-asc" ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price));
        }
        return items;
    }, [menuCategoryRaw, activeCategoryId, search, availableOnly, sort]);

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

    const totalCartItems = Object.values(cart).reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const cartSubtotal = Object.values(cart).reduce(
        (sum, entry) => sum + Number(entry.item.price) * entry.quantity,
        0
    );

    const resetCart = () => {
        setCart({});
    };

    if (isLoading) {
        return (
            <div className='my-5 flex items-center gap-2'>
                <Loader2 className="w-4 h-4 animate-spin" />
                loading . . .
            </div>
        )
    }

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-1 gap-5 items-start">
            <div className="flex flex-col gap-4 min-w-0">
                <div className="grid grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-1 gap-4 items-start">

                    {/* --- CATEGORIES --- */}
                    <div className="bg-white border border-gray-200 rounded-[12px] flex flex-col lg:min-h-0 min-h-[520px]">
                        <h3 className="text-sm font-semibold text-gray-800 px-4 py-4 border-b lg:hidden">Categories</h3>
                        <div className="flex flex-col lg:flex-row gap-1 p-2 flex-1 lg:overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                            {menuCategoryList.map((cat) => {
                                const Icon = categoryIcon(cat.name);
                                const isActive = cat.id === activeCategoryId && !search.trim();
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategoryId(cat.id);
                                            setSearch("");
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm text-left whitespace-nowrap transition-colors ${isActive
                                            ? "bg-orange-50 text-orange-600 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Icon size={16} className="shrink-0" />
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-3 lg:hidden">
                            <button
                                onClick={() => router.push('/menu')}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] border border-gray-200 bg-gray-50 text-xs text-gray-600 hover:bg-gray-100"
                            >
                                <Settings2 size={14} />
                                Manage Categories
                            </button>
                        </div>
                    </div>

                    {/* --- ITEMS --- */}
                    <div className="space-y-4 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-baseline gap-2 mr-auto">
                                <h2 className="text-lg font-bold text-gray-800">
                                    {search.trim() ? "Search results" : activeCategory?.name}
                                </h2>
                                <span className="text-gray-400 text-xs">{visibleItems.length} items</span>
                            </div>
                            <div className="relative sm:w-full">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search items..."
                                    className="h-9 w-[200px] sm:w-full pl-9 pr-3 border border-gray-200 rounded-[8px] text-sm outline-none focus:border-orange-400"
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={`h-9 flex items-center gap-2 px-3 border rounded-[8px] text-sm ${availableOnly || sort !== "default" ? "border-orange-400 text-orange-600" : "border-gray-200 text-gray-600"}`}>
                                        <Filter size={14} />
                                        Filters
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuCheckboxItem checked={availableOnly} onCheckedChange={(v) => setAvailableOnly(Boolean(v))}>
                                        Available only
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs text-gray-500">Sort by price</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as TSort)}>
                                        <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="price-asc">Low to high</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="price-desc">High to low</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-3 max-h-[560px] lg:max-h-none overflow-y-auto pr-1">
                            {visibleItems.length === 0 ?
                                <p className='text-sm text-gray-500'>No items found.</p>
                                :
                                visibleItems.map((item) => (
                                    <MenuItemRow
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

                {/* --- CURRENT ORDER BAR --- */}
                <div className="bg-white border border-gray-200 rounded-[12px] px-5 py-3 flex items-center gap-6 sm:gap-3 sm:px-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-[8px] bg-gray-100 flex items-center justify-center">
                            <Lock size={15} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-800">Current Order</p>
                            <p className="text-[11px] text-gray-500">{totalCartItems} items</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400">TOTAL</p>
                        <p className="text-lg sm:text-base font-bold text-orange-600">NGN {cartSubtotal.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => setOpenCheckout(true)}
                        disabled={totalCartItems === 0}
                        className="ml-auto px-12 lg:px-6 py-3 rounded-[8px] text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-50 disabled:text-orange-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Place Order
                    </button>
                </div>
            </div>

            <MenuQrPanel />

            {openCheckout && (
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
                            initialTableId={initialTableId}
                            onResetCart={resetCart}
                            onClose={() => setOpenCheckout(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

interface IMenuItemRowProps {
    item: TMenuItem;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
}

const MenuItemRow = ({ item, quantity, onAdd, onRemove }: IMenuItemRowProps) => {
    const isUnavailable = !item.is_available || item.stock_quantity < 1;

    return (
        <div className="bg-white border border-gray-200 rounded-[12px] p-3 flex items-center gap-4 sm:gap-3">
            <Image
                width={80}
                height={80}
                src={item.image_url}
                alt={item.name}
                className={`w-[72px] h-[72px] object-cover rounded-[8px] shrink-0 ${isUnavailable ? 'grayscale' : ''}`}
            />
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-800 leading-tight">{item.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mt-0.5">{item.description}</p>
                <p className="text-[11px] text-gray-500 mt-1">{item.stock_quantity} {item.unit_type.toLocaleLowerCase()}(s) left</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-[11px] font-semibold text-gray-500">NGN</p>
                <p className="font-bold text-gray-800">{Number(item.price).toLocaleString()}</p>
            </div>
            <div className="w-[90px] sm:w-auto flex justify-end shrink-0">
                {isUnavailable ? (
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Unavailable</span>
                ) : quantity === 0 ? (
                    <button
                        onClick={onAdd}
                        className="px-5 py-2 border border-orange-300 text-orange-600 rounded-[8px] text-sm font-medium hover:bg-orange-50"
                    >
                        Add
                    </button>
                ) : (
                    <div className="flex items-center border border-orange-300 rounded-[8px]">
                        <button onClick={onRemove} aria-label="Remove one" className="h-8 w-7 flex items-center justify-center text-orange-600">
                            <Minus size={14} />
                        </button>
                        <span className="px-1 text-sm font-bold">{quantity}</span>
                        <button onClick={onAdd} aria-label="Add one" className="h-8 w-7 flex items-center justify-center text-orange-600">
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

const CheckoutCard = ({
    cart,
    initialTableId,
    onClose,
    onResetCart
}: {
    cart: Record<string, TCartItem>;
    initialTableId?: string;
    onClose: () => void;
    onResetCart: () => void;
}) => {

    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [showCheckoutForm, setShowCheckoutForm] = useState(false);

    const [waiterName, setWaiterName] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [tableId, setTableId] = useState(initialTableId ?? "");

    const { data: tablesResponse } = TableManagementApi.useGetAllTables();
    const tables = (tablesResponse?.data ?? []).filter((table) => table.is_active);

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
            ...(tableId ? { table_id: tableId } : {}),
            items: Object.values(cart).map((entry) => ({
                menu_item_id: entry.item.id,
                quantity: entry.quantity,
                special_notes: ""
            }))
        };

        createOrderMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Order created and sent to kitchen.');

                setShowCheckoutForm(false);
                setWaiterName('');
                setGuestCount('');
                setTableId('');

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
                            className="flex justify-between items-start"
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
                            onClick={() => {
                                onResetCart();
                                onClose();
                            }}
                            disabled={items.length === 0}
                            className="w-full h-10 text-sm bg-white hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed! text-slate-700 border border-gray-500 font-semibold rounded-[5px] shadow-none"
                        >
                            Clear cart
                        </Button>
                    </>
                ) : (
                    <>
                        <select
                            value={tableId}
                            onChange={(e) => setTableId(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 h-10 outline-none text-sm bg-white"
                        >
                            <option value="">No table (takeaway / walk-in)</option>
                            {tables.map((table) => (
                                <option key={table.id} value={table.id}>
                                    {table.label} · {table.capacity} seats
                                </option>
                            ))}
                        </select>

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
