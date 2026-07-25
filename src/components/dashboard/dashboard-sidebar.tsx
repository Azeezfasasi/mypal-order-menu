"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { BusinessCategoryType } from "@/types/enums";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

export default function DashboardSidebar({
  isOpen,
  onToggle,
  isMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [showTutorial, setShowTutorial] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const business = useAuthStore((state) => state.business);

  // Close sidebar when route changes (mobile only)
  useEffect(() => {
    // Only close if the pathname actually changed (not on initial render)
    if (pathname !== prevPathname && isMobile && isOpen) {
      // Add a small delay to prevent flickering and ensure navigation is complete
      const timer = setTimeout(() => {
        onToggle();
      }, 150);
      return () => clearTimeout(timer);
    }
    setPrevPathname(pathname);
  }, [isMobile, isOpen, onToggle, pathname, prevPathname]); // Only depend on pathname

  const [selectedBusinessType,] = useState(
    business?.category?.business_type,
  );

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    ...(selectedBusinessType === BusinessCategoryType.ICONICDELICACIES
      ? [
          {
            title: "Menu Management",
            href: "menu-management",
            icon: UtensilsCrossed,
          },
          {
            title: "Orders",
            href: "/orders",
            icon: ShoppingCart,
          }
        ]
      : []
    ),
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile overlay - only when mobile and open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Fixed positioning and width handling */}
      <aside
        className={cn(
          "flex h-full flex-col bg-[#001529] transition-all duration-300 ease-in-out pt-2",
          // Desktop width handling
          !isMobile && isOpen && "w-64",
          !isMobile && !isOpen && "w-16",
          // Mobile positioning and transform
          isMobile && "fixed left-0 top-0 z-50 w-64 h-screen",
          isMobile && isOpen && "translate-x-0",
          isMobile && !isOpen && "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-4 flex-shrink-0 relative">
          <div className="flex flex-col items-start justify-center transition-all duration-300 gap-0">
            <h1
              className={cn(
                "text-2xl font-bold text-white transition-all duration-300 font-sora",
                !isOpen && !isMobile && "lg:opacity-0 scale-95",
              )}
            >
              My
              <span
                className={cn(
                  "text-primary transition-all duration-300",
                  !isOpen && !isMobile && "opacity-0",
                )}
              >
                Pal
              </span>
            </h1>
            <p className="text-white md:text-[14px] text-[14px] truncate">Business Operations</p>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 text-white hover:bg-blue-950 transition-colors"
              onClick={onToggle}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation - Scrollable if needed */}
        <nav className="flex-1 space-y-1 overflow-y-hidden px-2 py-4">
          {navItems.map((item) => {
            
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-gray-300 hover:bg-blue-900 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "ml-3 transition-all duration-300 whitespace-nowrap truncate",
                    !isOpen &&
                    !isMobile &&
                    "opacity-0 translate-x-2 pointer-events-none",
                  )}
                >
                  {item.title}
                </span>
                {/* Tooltip for collapsed state */}
                {!isOpen && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.title}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Tutorial Card */}
        {showTutorial && (isOpen || isMobile) && (
          <div
            className={cn(
              "m-3 rounded-md bg-blue-900 p-4 text-white flex-shrink-0 transition-all duration-300",
              !isOpen && !isMobile && "opacity-0 scale-95 pointer-events-none",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 rounded-md bg-white p-1">
                  <HelpCircle className="h-5 w-5 text-blue-900" />
                </div>
                <span className="text-sm font-medium">Welcome</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-blue-800 transition-colors"
                onClick={() => setShowTutorial(false)}
              >
                <span className="sr-only">Close</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs">
              Get to know your MyPal Dashboard with our short walkthrough
              course.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Button
                variant="default"
                size="sm"
                className="h-7 bg-primary text-xs hover:bg-primary/90 transition-colors"
              >
                Start Tutorial
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-300 hover:bg-blue-800 hover:text-white transition-colors"
                onClick={() => setShowTutorial(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="border-t border-blue-900 p-4 flex-shrink-0">
          <div
            className={cn(
              "flex items-center transition-all duration-300",
              !isOpen && !isMobile && "justify-center",
            )}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src="/placeholder.svg?height=40&width=40"
                alt="User"
              />
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "ml-3 transition-all duration-300 min-w-0",
                !isOpen &&
                !isMobile &&
                "opacity-0 translate-x-2 pointer-events-none",
              )}
            >
              <p className="text-sm font-medium text-white truncate">
                {business?.business_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {business?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Collapse button (desktop only) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="absolute -right-3 top-20 z-10 rounded-full border border-gray-200 bg-white text-gray-500 shadow-md hover:bg-gray-100 transition-all duration-200"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </aside>
    </>
  );
}
