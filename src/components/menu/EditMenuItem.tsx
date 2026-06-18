"use client"

import { useEffect, useState } from "react"
import { Upload, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import { toast } from "sonner"
import { MenuAndOrdersApi } from "@/services/api/fine-din-menu-orders-api"
import { TMenuItem } from "./MenuPage"
import { useQueryClient } from "@tanstack/react-query"
import { Textarea } from "../ui/textarea"

export default function EditMenuItemModal({
    isOpen,
    onOpenChange,
    item,
    category_id
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    item: TMenuItem | null,
    category_id: string
}) {

    const { data: menuCategoryResponse } = MenuAndOrdersApi.useGetMenuCategories();
    const menuCategoryList = menuCategoryResponse?.data;

    const [formData, setFormData] = useState({
        category_id: "",
        name: "",
        description: "",
        price: 0,
        stock_quantity: 0,
        unit_type: "",
        is_available: true,
        image: null as File | null
    })

    const [existingImage, setExistingImage] = useState<string | null>(null)

    const unit_types = [
        'Portion', 'Plate', 'Pack', 'Bowl', 'Cup', 'Tray', 'Piece', 'Wrap', 'Small', 'Medium', 'Large'
    ]

    useEffect(() => {
        if (!item) return

        setFormData({
            category_id: category_id,
            name: item.name,
            description: item.description ?? "",
            price: Number(item.price),
            stock_quantity: item.stock_quantity,
            unit_type: item.unit_type ?? "",
            is_available: item.is_available,
            image: null
        })

        setExistingImage(item.image_url ?? null)
    }, [item, category_id])

    const updateMenuItemMutation = MenuAndOrdersApi.useUpdateMenuItem();

    const queryClient = useQueryClient();

    const initialFormState = {
        category_id: "",
        name: "",
        description: "",
        price: 0,
        stock_quantity: 0,
        unit_type: "",
        is_available: true,
        image: null as File | null
    }

    const handleClose = () => {
        setFormData(initialFormState)
        setExistingImage(null)
        onOpenChange(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error("Item name is required")
            return
        }

        if (!formData.category_id) {
            toast.error("Please select a category")
            return
        }

        if (!formData.unit_type) {
            toast.error("Please select a unit type")
            return
        }

        if (formData.price <= 0) {
            toast.error("Price must be greater than 0")
            return
        }

        if (formData.stock_quantity <= 0) {
            toast.error("Enter stock quantity")
            return
        }

        if (!formData.description.trim()) {
            toast.error("Description is required");
            return;
        }

        const payload = {
            category_id: formData.category_id,
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            stock_quantity: Number(formData.stock_quantity),
            unit_type: formData.unit_type,
            is_available: formData.is_available,
            image: formData.image!,
        }

        console.log("EDIT PAYLOAD:", payload)

        if (!item) {
            toast.error('Invalid item Id')
        }

        updateMenuItemMutation.mutate({
            id: item?.id ?? '',
            payload
        }, {
            onSuccess: () => {
                toast.success('Menu item updated!');
                queryClient.invalidateQueries({
                    queryKey: ["menu-orders", 'categories']
                })
                handleClose();
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] max-h-[95dvh] overflow-auto rounded-[5px] p-5 border-none gap-0">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        Edit Menu Item
                    </DialogTitle>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 p-3 bg-[#F8F8F8] rounded-[10px]">

                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-4">

                            {/* ITEM NAME */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-[#101928]">
                                    Item name
                                </Label>

                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))
                                    }
                                    className="h-11 shadow-none bg-white text-sm border-gray-200 focus-visible:ring-orange-500"
                                />
                            </div>

                            {/* CATEGORY */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-[#101928]">
                                    Category
                                </Label>

                                <Select
                                    value={formData.category_id}
                                    onValueChange={(value) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            category_id: value
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-11 bg-white text-sm shadow-none border-gray-200 focus:ring-orange-500 text-gray-400">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {menuCategoryList?.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* UNIT TYPE */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-[#101928]">
                                    Unit type
                                </Label>

                                <Select
                                    value={formData.unit_type}
                                    onValueChange={(value) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            unit_type: value
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-11 bg-white text-sm shadow-none border-gray-200 focus:ring-orange-500">
                                        <SelectValue placeholder="Select unit type" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {unit_types.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                                {unit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PRICE */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-[#101928]">
                                    Price
                                </Label>

                                <Input
                                    type="number"
                                    value={formData.price || ""}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            price: Number(e.target.value)
                                        }))
                                    }
                                    className="h-11 shadow-none bg-white text-sm border-gray-200 focus-visible:ring-orange-500"
                                />
                            </div>

                            {/* STOCK */}
                            <div className="space-y-2 col-span-full">
                                <Label className="text-sm font-semibold text-[#101928]">
                                    Stock quantity
                                </Label>

                                <Input
                                    type="number"
                                    value={formData.stock_quantity || ""}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            stock_quantity: Number(e.target.value)
                                        }))
                                    }
                                    className="h-11 shadow-none bg-white text-sm border-gray-200 focus-visible:ring-orange-500"
                                />
                            </div>

                        </div>

                        {/* IMAGE (MATCHING ADD STYLE EXACTLY) */}
                        <div className="space-y-2 col-span-full">
                            <Label className="text-sm font-semibold text-[#101928]">
                                Item image
                            </Label>

                            <div className="bg-white border border-dashed border-gray-200 rounded-[10px] p-4">

                                {!formData.image ? (
                                    existingImage ? (
                                        <div className="relative rounded-[10px] overflow-hidden border border-gray-100">
                                            <Image
                                                src={existingImage}
                                                alt="existing"
                                                width={500}
                                                height={300}
                                                className="w-full h-[220px] object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setExistingImage(null)}
                                                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="edit-menu-image"
                                            className="h-[180px] flex flex-col items-center justify-center cursor-pointer rounded-[10px] bg-[#FAFAFA] hover:bg-[#F5F5F5] transition"
                                        >
                                            <div className="p-3 rounded-full bg-orange-50 text-[#F05523] mb-3">
                                                <Upload size={22} />
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700">
                                                Click to upload image
                                            </p>

                                            <p className="text-xs text-gray-400 mt-1">
                                                PNG, JPG or WEBP
                                            </p>

                                            <input
                                                id="edit-menu-image"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        image: file
                                                    }))
                                                    setExistingImage(null)
                                                }}
                                            />
                                        </label>
                                    )
                                ) : (
                                    <div className="relative rounded-[10px] overflow-hidden border border-gray-100">
                                        <Image
                                            src={URL.createObjectURL(formData.image)}
                                            alt="preview"
                                            width={500}
                                            height={300}
                                            className="w-full h-[220px] object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    image: null
                                                }))
                                            }
                                            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="col-span-full space-y-2">
                            <Label className="text-sm font-semibold text-[#101928]">
                                Description
                            </Label>

                            <Textarea
                                placeholder="Describe the flavor profile, ingredients, and preparation method..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))
                                }
                                className="min-h-[120px] bg-white text-sm border-gray-200 focus-visible:ring-orange-500 resize-none placeholder:text-gray-300 shadow-none"
                            />

                            <p className="text-right text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                                Not more than 60 words
                            </p>
                        </div>

                        {/* SWITCH */}
                        <div className="flex items-center justify-between p-4 rounded-[10px] border bg-white border-gray-100">

                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    Availability
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    Toggle menu visibility for guests
                                </p>
                            </div>

                            <Switch
                                className="data-[state=checked]:bg-[#DA3807]"
                                checked={formData.is_available}
                                onCheckedChange={(v) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        is_available: v
                                    }))
                                }
                            />
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="grid grid-cols-2 gap-4 pt-2">

                        <DialogClose asChild>
                            <Button type="button" className="h-11 sm:h-10" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button disabled={updateMenuItemMutation.isPending} className="disabled:opacity-60 h-11 sm:h-10" type="submit">
                            {updateMenuItemMutation.isPending ? 'updating . . .' : 'Update Item'}
                        </Button>

                    </div>
                </form>

            </DialogContent>
        </Dialog>
    )
}