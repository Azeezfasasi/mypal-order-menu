"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MenuCategoryResponse } from "@/types/fine-din-menu-orders-types";

interface AddMenuCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: MenuCategoryResponse[number] | null;
}

export default function AddMenuCategoryModal({ isOpen, onClose, category }: AddMenuCategoryModalProps) {

    const [categoryName, setCategoryName] = useState("");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (category) {
            setCategoryName(category.name);
            setIsActive(category.is_active);
        }
    }, [category]);

    const handleClose = () => {
        // Reset form states on close
        setCategoryName("");
        setIsActive(true);
        onClose();
    };

    const addMenuCategoryMutation = MenuAndOrdersApi.useCreateMenuCategory();
    const updateMenuCategoryMutation = MenuAndOrdersApi.useUpdateMenuCategory();
    const business = useAuthStore((state) => state.business);
    const queryClient = useQueryClient();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            business_id: business?.id ?? '',
            name: categoryName,
            is_active: isActive
        };

        if (category?.id) {
            // UPDATE MODE
            updateMenuCategoryMutation.mutate(
                {
                    id: category.id,
                    payload
                },
                {
                    onSuccess: () => {
                        toast.success("Category updated!");
                        queryClient.invalidateQueries({
                            queryKey: ["menu-orders", "categories"]
                        });
                        handleClose();
                    }
                }
            );
        } else {
            // CREATE MODE
            addMenuCategoryMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success("Menu category added!");
                    queryClient.invalidateQueries({
                        queryKey: ["menu-orders", "categories"]
                    });
                    handleClose();
                }
            });
        }
    };

    const isLoading = addMenuCategoryMutation.isPending || updateMenuCategoryMutation.isPending;


    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();

    //     // Log data format precisely as requested
    //     console.log({
    //         name: categoryName,
    //         is_active: isActive
    //     });

    //     addMenuCategoryMutation.mutate({
    //         business_id: business?.id ?? '',
    //         name: categoryName,
    //         is_active: isActive
    //     }, {
    //         onSuccess: () => {
    //             toast.success('Menu category added!');
    //             queryClient.invalidateQueries({
    //                 queryKey: ["menu-orders", 'categories']
    //             })
    //             handleClose();
    //         }
    //     })

    // };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[500px] w-[calc(100%-32px)] p-6 sm:p-4 gap-0 rounded-2xl bg-white border-none shadow-2xl outline-none [&>button]:hidden">

                {/* Header matching your design language */}
                <div className="flex items-center justify-between">
                    <DialogTitle className="text-lg font-bold text-[#111928]">
                        {category?.id ? "Edit Category" : "Add Category"}
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 border border-orange-200 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                        <X className="h-4 w-4 stroke-[2.5]" />
                    </button>
                </div>

                {/* Form elements styled inside the light-grey panel container */}
                <form onSubmit={handleSubmit} className="pt-5 space-y-6">
                    <div className="bg-[#F9FAFB] border border-gray-100 rounded-[10px] p-4 space-y-5">

                        {/* Field 1: Category Name Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 tracking-wide block">
                                Category Name
                            </label>
                            <input
                                type="text"
                                required
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-[5px] text-gray-700 font-medium text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#D93F0B] transition-all"
                                placeholder="e.g., Soups"
                            />
                        </div>

                        {/* Field 2: Status Toggle Switch */}
                        <div className="flex items-center justify-between bg-white border border-gray-300 rounded-[5px] p-3">
                            <div className="space-y-0.5">
                                <label className="text-xs font-bold text-gray-700 tracking-wide block">
                                    Active Status
                                </label>
                                <p className="text-[11px] text-gray-400">
                                    Visible to customers on the menu selection grid.
                                </p>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                className="data-[state=checked]:bg-[#D93F0B] data-[state=unchecked]:bg-gray-200"
                            />
                        </div>

                    </div>

                    {/* Form Action CTA */}
                    <button
                        disabled={isLoading}
                        type="submit"
                        className="w-full bg-[#D93F0B] hover:bg-[#b83206] text-white font-semibold py-3.5 sm:py-3 px-4 rounded-[10px] transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ?
                            'loading . . .'
                            :
                            category?.id ? "Update Category" : "Create Category"
                        }
                    </button>
                </form>

            </DialogContent>
        </Dialog>
    );
}