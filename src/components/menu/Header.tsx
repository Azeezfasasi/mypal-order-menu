'use client'
import { Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react';
import AddMenuModal from './AddMenuItem';
import AddMenuCategoryModal from './AddMenuCategory';

const tabs = [
    { label: 'Menu', title: 'Menu Manager', route: "/menu" },
    { label: 'Orders', title: 'Orders', route: "/menu/orders" },
    { label: 'Waiters', title: 'Waiters', route: "/menu/waiters" },
    { label: 'Kitchen', title: 'Kitchen', route: "/menu/kitchen" },
    { label: 'Stock', title: 'Stock & Inventory', route: "/menu/stock" },
]

export const MenuActions = () => {
    const [open, setOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    return (
        <div className="flex gap-3">
            <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-1 px-4 py-2 border border-orange-500 text-orange-600 rounded-[8px] text-sm font-semibold hover:bg-orange-50 transition-colors whitespace-nowrap">
                <Plus size={16} />
                Add Category
            </button>
            <button onClick={() => setOpen(true)} className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-[8px] text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap">
                <Plus size={16} />
                Add Item
            </button>

            <AddMenuModal
                isOpen={open}
                onOpenChange={setOpen}
            />

            <AddMenuCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />
        </div>
    )
}

const Header = ({ showActions = true }: { showActions?: boolean }) => {

    const pathname = usePathname();
    const router = useRouter();

    const now = new Date();
    const currentHour = now.getHours();

    const servicePeriod =
        currentHour < 12
            ? 'Morning service'
            : currentHour < 17
                ? 'Afternoon service'
                : 'Evening service';

    return (
        <div className="mb-6">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">{tabs.find(x => x.route === pathname)?.title}</h1>
                <p className="text-[#667185] text-sm font-medium">Manage your business operations effortlessly</p>
            </div>

            <div className="flex items-end justify-between gap-4 lg:flex-col-reverse lg:items-start">
                <nav className="flex border-b border-gray-200 overflow-x-auto max-w-full" style={{ scrollbarWidth: "none" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.route}
                            onClick={() => router.push(tab.route)}
                            className={`px-5 pb-2.5 pt-1 text-[15px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${pathname === tab.route
                                ? "text-orange-600 border-orange-600"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <p className="text-[#667185] text-sm pb-2.5 lg:pb-0">
                    {now.toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                    {" • "}
                    {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {" • "}
                    {servicePeriod}
                </p>
            </div>

            {showActions && (
                <div className="flex justify-end mt-5">
                    <MenuActions />
                </div>
            )}
        </div>
    )
}

export default Header
