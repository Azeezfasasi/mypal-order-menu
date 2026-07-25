"use client"

import OrderManagement from '@/components/room-management/OrderManagement'
import RoomManagement from '@/components/room-management/RoomManagement'
import { UnauthorizedAccess } from '@/components/dashboard/Unauthorizedaccess'
import { useAuthStore } from "@/stores/auth-store";

// Every business category this dashboard currently knows how to route to.
// Shown to the user when their account matches none of them.
const SUPPORTED_CATEGORIES = ["Hotel Experience", "Iconic Delicacies"];

export default function DashboardPage() {
  const business = useAuthStore((state) => state.business);
  const categoryName = String(business?.category?.name ?? "").toLowerCase();
  const categoryType = String(business?.category?.business_type ?? business?.business_type ?? "").toLowerCase();

  const isHotelExperience =
    categoryName.includes("hotel") ||
    categoryType.includes("hotel experience") ||
    categoryType.includes("hotelexperience");
  const isIconicDelicacy =
    categoryName.includes("iconic delicacies") ||
    categoryType.includes("iconic delicacies") ||
    categoryType.includes("iconicdelicacies");
  const isMainstream =
    categoryName.includes("mainstream") ||
    categoryType.includes("mainstream");
  const canAccessOrders = isIconicDelicacy || isMainstream;

  // No known section matches this account's category at all
  const isUnauthorized = !canAccessOrders && !isHotelExperience;

  return (
    <>
      {/* Welcome Section */}
      <div className="flex items-center mb-6 gap-4">
        <div>
          {/* Greetings */}
          <div>
            <h1 className="md:text-[12px] text-[22px] text-[#DB3A07] leading-[100%] font-bold">Good morning, <br /> <span className="text-[#031927] font-extrabold md:text-[16px] text-[20px] leading-[100%]">{business?.business_name || "Guest"}</span> 👋</h1>
            {isIconicDelicacy && (
            <p className="md:text-[12px] text-[14px] font-bold text-[#68798A] leading-[100%] flex items-center gap-1 mt-1">
              Order Manager
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            </p>
            )}
            {isHotelExperience && (
            <p className="md:text-[12px] text-[14px] font-bold text-[#68798A] leading-[100%] flex items-center gap-1 mt-1">
              Room Management
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            </p>
            )}
          </div>
        </div>
      </div>

      {isUnauthorized && (
        <UnauthorizedAccess
          currentCategory={business?.category?.name}
          requiredCategories={SUPPORTED_CATEGORIES}
        />
      )}

      {canAccessOrders &&
        <OrderManagement />
      }
      {isHotelExperience &&
        <RoomManagement />
      }
    </>
  )
}