"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import Header from "./Header";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { MenuCategoryResponse } from "@/types/fine-din-menu-orders-types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";


type TMenuItem = MenuCategoryResponse[number]['items'][number]

export default function StockPage() {

    const { data: menuCategoryResponse, isLoading } = MenuAndOrdersApi.useGetMenuCategories();
    const menuCategoryList = [...(menuCategoryResponse?.data || [])].reverse();

    const [activeCategoryId, setActiveCategoryId] = useState("");

    useEffect(() => {
        if (menuCategoryList?.length && !activeCategoryId) {
            setActiveCategoryId(menuCategoryList[0].id);
        }
    }, [menuCategoryList]);

    const activeCategory = menuCategoryList?.find((c) => c.id === activeCategoryId);

    const [selectedItem, setSelectedItem] = useState<TMenuItem | null>(null);
    const [quantity, setQuantity] = useState("");

    const handleOpenRestockModal = (item: TMenuItem) => {
        setSelectedItem(item);
        setQuantity(""); // reset input
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
    };

    const restockMutation = MenuAndOrdersApi.useRestockMenuItem();
    const queryClient = useQueryClient();

    const handleConfirmUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedItem) return;

        console.log({
            item_id: selectedItem.id,
            quantity_to_add: Number(quantity)
        });

        restockMutation.mutate({
            id: selectedItem.id,
            payload: {
                quantity_to_add: Number(quantity)
            }
        }, {
            onSuccess: () => {
                toast.success('Item restocked!');
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'categories']
                })
                handleCloseModal();
            }
        })

    };

    return (
        <div className="space-y-6">

            <Header />

            {isLoading ?
                <div className='my-5 flex items-center gap-2'>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    loading . . .
                </div>
                :
                !menuCategoryList ?
                    <p className="text-[15px] font-medium">No data</p>
                    :
                    (menuCategoryList?.length) === 0 ?
                        <p className='text-[15px] font-medium'>No menu items available</p>
                        :
                        <>
                            {/* --- CATEGORY TAB --- */}
                            <Tabs value={activeCategoryId} onValueChange={setActiveCategoryId}>
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
                                        <h2 className="text-[22px] font-bold text-[#5F5E5E]">{activeCategory?.name}</h2>
                                        <span className="text-[#4D4635] text-xs font-medium">{activeCategory?.items.length} Items</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-3">
                                    {activeCategory?.items.length === 0 ?
                                        <p className='text-[15px] col-span-full font-medium'>No menu items.</p>
                                        :
                                        activeCategory?.items.map((item) => (
                                            <div
                                                key={item.id}
                                                // onClick={() => handleOpenRestockModal(item)}
                                                className="bg-white border border-[#C9CED4] rounded-[10px] p-4 shadow-none hover:shadow-sm cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                                            >
                                                <div className="relative w-full h-[200px] rounded-2xl overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        unoptimized
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between pt-4 pb-1">

                                                    <h3 className="text-base font-bold text-gray-700 tracking-wide">
                                                        {item.name}
                                                    </h3>

                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#D93F0B]">
                                                        {item.stock_quantity < 10 && <AlertTriangle className="h-4 w-4 fill-orange-50 stroke-[#D93F0B]" />}
                                                        <span>{item.stock_quantity} left</span>
                                                    </div>

                                                </div>
                                                <button
                                                    onClick={() => handleOpenRestockModal(item)}
                                                    className="mt-4 w-full py-2 text-sm font-semibold rounded-[6px] bg-[#D93F0B] text-white hover:bg-[#b83206] transition-colors"
                                                >
                                                    Restock Item
                                                </button>
                                            </div>
                                        ))}
                                </div>

                            </div>


                            {/* Restock Flow Controlled Overlay Dialog */}
                            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && handleCloseModal()}>
                                <DialogContent className="max-w-[560px] w-[calc(100%-32px)] p-5 gap-0 rounded-[10px] bg-white border-none shadow-2xl outline-none [&>button]:hidden">

                                    <div className="flex items-center justify-between">
                                        <DialogTitle className="text-lg font-bold text-[#111928]">
                                            Restock flow
                                        </DialogTitle>
                                        <button
                                            onClick={handleCloseModal}
                                            className="p-1.5 border border-orange-200 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                                        >
                                            <X className="h-4 w-4 stroke-[2.5]" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleConfirmUpdate} className="pt-5 space-y-5">
                                        <div className="bg-[#F9FAFB] border border-gray-100 rounded-[10px] p-3 space-y-4">

                                            {/* Target Selected Element Label Row */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700 tracking-wide">
                                                    Item selected
                                                </label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={selectedItem?.name || "Lamb Chops"}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-[5px] text-gray-600 font-medium text-sm shadow-none cursor-not-allowed select-none focus:outline-none"
                                                />
                                            </div>

                                            {/* Dynamic Restock Quantity Target Box */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700 tracking-wide">
                                                    Add quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-[5px] text-gray-700 font-medium text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#D93F0B] transition-all"
                                                    placeholder="0"
                                                />
                                            </div>

                                        </div>

                                        {/* Form Confirmation Call-To-Action Button */}
                                        <button
                                            type="submit"
                                            disabled={restockMutation.isPending}
                                            className="w-full bg-[#D93F0B] hover:bg-[#b83206] disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm tracking-wide"
                                        >
                                            {restockMutation.isPending ? 'updating . . .' : 'Confirm Update'}
                                        </button>
                                    </form>

                                </DialogContent>
                            </Dialog>
                        </>}
        </div>
    );
}