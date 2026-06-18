
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import Image from "next/image";

export default function DashboardMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Menu Management",
      href: "/menu-management",
      icon: UtensilsCrossed,
    },
    {
      label: "Orders",
      href: "/orders",
      icon: ShoppingCart,
    }
  ];

  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-[#DB3A07] text-white hover:bg-[#c2310a] transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-linear-to-b from-[#031927] to-[#0a3a4f] text-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 md:translate-x-0 md:relative md:h-auto md:flex md:flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg flex items-center justify-center">
              {/* logo */}
                <Image
                    src="/images/mypal.svg"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="w-10 h-10"
                />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">MyPal</h1>
              <p className="text-xs text-gray-400">Iconic Delicacy</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active
                    ? "bg-[#DB3A07] text-white shadow-lg"
                    : "text-gray-300 hover:bg-white hover:bg-opacity-10"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform group-hover:scale-110 ${
                    active ? "text-white" : "text-gray-400"
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white border-opacity-10 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-all duration-200 group">
            <LogOut size={20} className="text-gray-400 group-hover:text-white" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
