"use client";

import { BusinessCategorySelector } from "@/components/business-category-selector";
import BarsLoungesOfferingsContent from "@/components/offerings/bars-lounges-offerings";
import BeachesResortOfferingsContent from "@/components/offerings/beaches-resort-offerings";
import BuffetOfferingsContent from "@/components/offerings/buffet-offerings";
import ClubOfferingsContent from "@/components/offerings/club-offerings";
import FineDiningOfferingsContent from "@/components/offerings/fine-dinings-offerings";
import MainstreamOfferingsContent from "@/components/offerings/mainstream-offering";
import NightlifeOfferingContent from "@/components/offerings/nightlife-offering";
import SalonSpaOfferingsContent from "@/components/offerings/salon-spa-offerings";
import ShortletOfferingsContent from "@/components/offerings/shortlet-offerings";
import { __DEV__ } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { BusinessCategoryType } from "@/types/enums";
import { useEffect, useState } from "react";

export default function OfferingsPage() {
  const { business: businessProfile } = useAuthStore();

  const [selectedBusinessType, setSelectedBusinessType] = useState(
    businessProfile?.category?.business_type,
  );
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCategoryChange = (category: BusinessCategoryType) => {
    // console.log("Business category changed to:", category);
    // Update the business category in Zustand store
    setSelectedBusinessType(category);
  };

  // Render the appropriate content based on selected business type
  const renderBusinessContent = () => {
    if (!mounted) return null;

    switch (selectedBusinessType) {
      case BusinessCategoryType.FINEDINING:
        return <FineDiningOfferingsContent />;
      case BusinessCategoryType.SHORTLET:
        return <ShortletOfferingsContent />;
      case BusinessCategoryType.SALONSANDSPA:
        return <SalonSpaOfferingsContent />;
      case BusinessCategoryType.ICONICDELICACIES:
        return <MainstreamOfferingsContent />;
      case BusinessCategoryType.BEACHESRESORTS:
        return <BeachesResortOfferingsContent />;
      case BusinessCategoryType.BUFFET:
        return <BuffetOfferingsContent />;
      case BusinessCategoryType.PARKSRECREATION:
        return <BeachesResortOfferingsContent />;
      case BusinessCategoryType.HOTELEXPERIENCE:
        return <ShortletOfferingsContent />;
      case BusinessCategoryType.NIGHTLIFE:
        return <NightlifeOfferingContent />;
      case BusinessCategoryType.CLUB:
        return <ClubOfferingsContent />;
      case BusinessCategoryType.BARSLOUNGES:
        return <BarsLoungesOfferingsContent />;
      case BusinessCategoryType.BOATYATCHCRUISE:
        return (
          <div className="flex h-64 items-center justify-center">
            <p className="text-lg text-gray-500">
              Boat and Yachts cruises offerings coming soon...
            </p>
          </div>
        );
      default:
        return <MainstreamOfferingsContent />;
    }
  };

  return (
    <div className="">
      <div className="mb-4">
        <h1 className="text-3xl md:text-xl font-bold">
          Services and offerings
        </h1>
        <p className="text-gray-600">
          Manage all the various services offered by your company with ease
        </p>
      </div>
      {__DEV__ && (
        <div className="my-6 grid grid-cols-3 items-center justify-between md:grid-cols-1 gap-3">
          <h3 className="text-lg font-bold col-span-1">
            Select Business Category
          </h3>
          <div className="col-auto"></div>
          <BusinessCategorySelector
            onCategoryChange={handleCategoryChange}
            initialValue={selectedBusinessType}
          />
        </div>
      )}
      {renderBusinessContent()}
    </div>
  );
}
