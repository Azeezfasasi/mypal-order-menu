'use client'
import { Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react';
import AddMenuModal from './AddMenuItem';
import AddMenuCategoryModal from './AddMenuCategory';


const Header = () => {

    const pathname = usePathname();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const titleData = [
        { title: 'Menu Manager', route: "/menu" },
        { title: 'Orders', route: "/menu/orders" },
        { title: 'Kitchen', route: "/menu/kitchen" },
        { title: 'Stock & Inventory', route: "/menu/stock" },
    ]

    const now = new Date();
    const currentHour = now.getHours();

    const servicePeriod =
        currentHour < 12
            ? 'Morning service'
            : currentHour < 17
                ? 'Afternoon service'
                : 'Evening service';

    return (
        <div>
            {/* Tab Switcher */}
            <div className="hidden xl:flex bg-white border w-fit mb-4 rounded-lg overflow-hidden">
                <button onClick={() => router.push('/menu')} className={`px-4 py-3 ${pathname === "/menu" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                    Menu
                </button>
                <button onClick={() => router.push('/menu/orders')} className={`px-4 py-3 ${pathname === "/menu/orders" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                    Orders
                </button>
                <button onClick={() => router.push('/menu/kitchen')} className={`px-4 py-3 ${pathname === "/menu/kitchen" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                    Kitchen
                </button>
                <button onClick={() => router.push('/menu/stock')} className={`px-4 py-3 ${pathname === "/menu/stock" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                    Stock
                </button>
            </div>
            <header className="flex flex-row sm:flex-col items-center md:items-start justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-xl font-bold">{titleData.find(x => x.route === pathname)?.title}</h1>
                    <p className="text-[#667185] text-sm">
                        {now.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}{" "}
                        - {servicePeriod}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex xl:hidden bg-white border rounded-lg overflow-hidden">
                    <button onClick={() => router.push('/menu')} className={`px-4 py-3 ${pathname === "/menu" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                        Menu
                    </button>
                    <button onClick={() => router.push('/menu/orders')} className={`px-4 py-3 ${pathname === "/menu/orders" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                        Orders
                    </button>
                    <button onClick={() => router.push('/menu/kitchen')} className={`px-4 py-3 ${pathname === "/menu/kitchen" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                        Kitchen
                    </button>
                    <button onClick={() => router.push('/menu/stock')} className={`px-4 py-3 ${pathname === "/menu/stock" ? "bg-blue-50 text-[#667185]" : "hover:bg-gray-50"} text-xs border-r flex items-center gap-2`}>
                        Stock
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-orange-500 text-orange-500 rounded-[8px] text-sm font-semibold hover:bg-orange-50 transition-colors">
                        <Plus size={18} className="border border-orange-500 rounded-full p-0.5" />
                        Add Category
                    </button>
                    <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-[8px] text-sm font-semibold hover:bg-orange-700 transition-shadow">
                        <Plus size={18} className="border-2 border-white rounded-full p-0.5" />
                        Add Item
                    </button>
                </div>

                <AddMenuModal
                    isOpen={open}
                    onOpenChange={setOpen}
                />

                <AddMenuCategoryModal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                />
            </header>
        </div>
    )
}

export default Header