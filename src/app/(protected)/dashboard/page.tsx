"use client"

import OrderManagement from '@/components/room-management/OrderManagement'
import RoomManagement from '@/components/room-management/RoomManagement'
import { UnauthorizedAccess } from '@/components/dashboard/Unauthorizedaccess'
import { useAuthStore } from "@/stores/auth-store";
import BusinessAccountSwitcher from '@/components/dashboard/BusinessAccountSwitcher';
import ShortletRoomManagement from '@/components/room-management/ShortletRoomManagement';
import FineDiningOverview from '@/components/dashboard/fine-dining/FineDiningOverview';
import MobilityFleetPage from "@/components/mobility/MobilityFleetPage";
import { isMobilityBusiness } from "@/types/mobility-types";

// Every business category this dashboard currently knows how to route to.
// Shown to the user when their account matches none of them.
const SUPPORTED_CATEGORIES = [
  "Hotel Experience",
  "Iconic Delicacies",
  "Short-let homes",
  "Fine Dining",
  "In-City Rides",
  "Luxury on Demand",
  "Household Logistics",
];

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
  const isShortlet =
    categoryName.includes("shortlet") ||
    categoryType.includes("short-let homes") ||
    categoryType.includes("shortlet homes") ||
    categoryType.includes("shortlethomes") ||
    categoryType.includes("short-let");
  const isFineDining =
    categoryName.includes("fine dining") ||
    categoryType.includes("fine dining") ||
    categoryType.includes("finedining");
  const isMobility = isMobilityBusiness(business?.category?.business_type);
  const canAccessOrders = isIconicDelicacy || isMainstream;

  // No known section matches this account's category at all
  const isUnauthorized = !canAccessOrders && !isHotelExperience && !isShortlet && !isFineDining && !isMobility;

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
            {isFineDining && (
            <p className="md:text-[12px] text-[14px] font-bold text-[#68798A] leading-[100%] flex items-center gap-1 mt-1">
              Order & Kitchen Overview
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

      <div className="mb-4">
        <BusinessAccountSwitcher />
      </div>

      {isUnauthorized && (
        <UnauthorizedAccess
          currentCategory={business?.category?.name}
          requiredCategories={SUPPORTED_CATEGORIES}
        />
      )}

      {canAccessOrders &&
      <>
        <OrderManagement />
      </>
      }
      {isHotelExperience &&
        <>
          <RoomManagement />
        </>
      }

      {isShortlet &&
        <ShortletRoomManagement />
      }

      {isFineDining &&
        <FineDiningOverview />
      }

      {isMobility && <MobilityFleetPage />}
    </>
  )
}