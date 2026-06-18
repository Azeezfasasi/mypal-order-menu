'use client'
import { Plus, MoreVertical, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Header from './Header';
import { MenuAndOrdersApi } from '@/services/api/fine-din-menu-orders-api';
import AddMenuItemModal from './AddMenuItem';
import { useState } from 'react';
import { MenuCategoryResponse } from '@/types/fine-din-menu-orders-types';
import AddMenuCategoryModal from './AddMenuCategory';
import EditMenuItemModal from './EditMenuItem';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export type TMenuItem = MenuCategoryResponse[number]['items'][number];

const MenuPage = () => {

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState('');

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<MenuCategoryResponse[number] | null>(null);

    const [editOpen, setEditOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<TMenuItem | null>(null)
    const [categoryId, setCategoryId] = useState('')

    const [open, setOpen] = useState(false);

    const { data: menuCategoryResponse, isLoading } = MenuAndOrdersApi.useGetMenuCategories();

    const menuCategoryList = [...(menuCategoryResponse?.data || [])].reverse();

    const deleteMenuItemMutation = MenuAndOrdersApi.useDeleteMenuItem();
    const queryClient = useQueryClient();

    const handleDeleteMenuItem = () => {
        if (!selectedDeleteId) {
            toast.error('Invalid id');
            return;
        }

        deleteMenuItemMutation.mutate(selectedDeleteId, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'categories']
                })
            }
        })
    }

    return (
        <div className="min-h-screen">
            <Header />

            {/* Menu Sections */}
            <section className="space-y-12">
                {isLoading ?
                    <div className='my-5 flex items-center gap-2'>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        loading . . .
                    </div>
                    :
                    !menuCategoryList ?
                        <p>No data</p>
                        :
                        (menuCategoryList?.length) === 0 ?
                            <p className='text-[15px]'>No menu items. Create a menu category to proceed.</p>
                            :
                            menuCategoryList.map((cat) => (
                                <div key={cat.id} className="space-y-6">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <div className="flex items-baseline gap-4">
                                            <h2 className="text-[22px] font-semibold text-[#5F5E5E]">{cat.name}</h2>
                                            <span className="text-[#4D4635] text-xs font-medium">{cat.items.length.toString().padStart(2, '0')} Items</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setCategoryModalOpen(true);
                                            }}
                                            className="text-[#DA3807] font-bold text-[13px] uppercase flex items-center hover:underline">
                                            Edit <span className='sm:hidden'>&nbsp;Category</span>
                                            {/* <span className="ml-1">›</span> */}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 items-start gap-6">
                                        {cat.items.map((item, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-[16px] border border-[#C9CED4] shadow-none relative hover:shadow-sm transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Image
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="w-16 h-16 rounded-2xl object-cover bg-orange-100"
                                                        width={64}
                                                        height={64}
                                                    />
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                <MoreVertical size={20} />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-32">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedItem(item)
                                                                    setCategoryId(cat.id)
                                                                    setEditOpen(true)
                                                                }}
                                                            >
                                                                Edit item
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedDeleteId(item.id)
                                                                    setDeleteModalOpen(true)
                                                                }}
                                                                className="text-red-500"
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <h3 className="text-lg font-bold text-[#5F5E5E] mb-2">{item.name}</h3>
                                                <p className="text-[#4D4635] text-sm leading-relaxed mb-6 line-clamp-2">
                                                    {item.description}
                                                </p>

                                                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                                    <span className=" font-bold text-[#DA3807]">
                                                        ₦{Number(item.price).toLocaleString()}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${item.stock_quantity > 0 ? 'bg-[#15803D]' : 'bg-gray-300'}`} />
                                                        <span className="text-xs font-medium text-[#15803D]">{item.stock_quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button onClick={() => setOpen(true)} className="border border-[1.5] border-dashed border-gray-400 bg-[#F3F3F34D] rounded-3xl flex flex-col items-center justify-center p-8 text-gray-400 hover:bg-gray-50 transition-colors group space-y-3">
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2 group-hover:border-orange-300 group-hover:text-orange-400">
                                                <Plus size={18} />
                                            </div>
                                            <span className="text-gray-500 group-hover:text-orange-400 text-[13px] font-semibold tracking-wide uppercase">Add {cat.name}</span>
                                        </button>

                                    </div>
                                </div>
                            ))}
            </section>

            {/* --- DELETE MENU ITEM MODAL --- */}
            <Dialog
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className='mb-3 font-bold'>
                            Delete Menu Item
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete this menu item?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="grid grid-cols-2 sm:grid-cols-1 gap-2 justify-end">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleDeleteMenuItem}
                            disabled={deleteMenuItemMutation.isPending}
                            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                        >
                            {deleteMenuItemMutation.isPending ? 'Deleting . . .' : 'Delete'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddMenuItemModal
                isOpen={open}
                onOpenChange={setOpen}
            />

            <EditMenuItemModal
                isOpen={editOpen}
                onOpenChange={(v) => {
                    setEditOpen(v)
                    if (!v) setCategoryId('')
                }}
                item={selectedItem}
                category_id={categoryId}
            />

            <AddMenuCategoryModal
                isOpen={categoryModalOpen}
                onClose={() => {
                    setCategoryModalOpen(false);
                    setSelectedCategory(null);
                }}
                category={selectedCategory}
            />

        </div>
    );
};
export default MenuPage;