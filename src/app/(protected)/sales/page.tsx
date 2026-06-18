"use client";

// pages/ReservationSalesAndRevenuePage.tsx
import { RevenuePageTemplate } from "@/components/revenue/RevenuePageTemplate";
import { useAuth } from "@/hooks/use-auth";
import { mapBusinessCategory } from "@/lib/business-category-utils";
import { BusinessOverviewAndRevenueApi } from "@/services/api/business-overview-and-revenue-api";
import { BusinessCategoryType } from "@/types/enums";

export default function ReservationSalesAndRevenuePage() {
  const { user: business } = useAuth();

  const rawBusinessCategory = business?.category?.business_type ?? "";
  const mappedCategory = mapBusinessCategory(rawBusinessCategory);

  const isTransactionalBusiness =
    mappedCategory === BusinessCategoryType.MAINSTREAM ||
    mappedCategory === BusinessCategoryType.ICONICDELICACIES ||
    mappedCategory === BusinessCategoryType.BEACHESRESORTS ||
    mappedCategory === BusinessCategoryType.SHORTLET ||
    mappedCategory === BusinessCategoryType.BUFFET ||
    mappedCategory === BusinessCategoryType.PARKSRECREATION ||
    mappedCategory === BusinessCategoryType.HOTELEXPERIENCE;

  if (isTransactionalBusiness) {
    // Mainstream businesses use transaction revenue
    return (
      <RevenuePageTemplate
        title="Transaction Sales and Revenue"
        description="View transaction metrics and payment performance of your business"
        buttonLabel="Payment trend analysis"
        revenueCardTitle="Total transaction revenue"
        previousRevenueCardTitle="Previous period transaction revenue"
        sectionTitle="Transaction revenue breakdown"
        backgroundColor="bg-primary-100"
        barColor="#059669"
        iconColor="text-green-600"
        revenueLabel="Transaction Revenue"
        useRevenueHook={
          BusinessOverviewAndRevenueApi.useGetBusinessTransactionRevenues
        }
        loadingMessage="Loading transaction revenue data.."
        errorMessage="Error loading transaction revenue data. Please try again."
        emptyStateMessage="No transaction revenue data available for this period"
        compareEmptyMessage="Please select start and end dates to compare transaction progress"
        isTransactionalBusiness={isTransactionalBusiness}
      />
    );
  } else if (!isTransactionalBusiness) {
    // Fine dining, buffet and salons/spa,  use reservation revenue
    return (
      <RevenuePageTemplate
        title="Sales and revenue"
        description="View key metrics and performance of your business"
        buttonLabel="Product sales trend"
        revenueCardTitle="Total reservations made"
        previousRevenueCardTitle="Previous period reservations"
        sectionTitle="Reservations breakdown"
        backgroundColor="bg-[#FFEFEF]"
        barColor="#001529"
        iconColor="text-primary-600"
        revenueLabel="Reservations"
        useRevenueHook={
          BusinessOverviewAndRevenueApi.useGetBusinessReservationRevenues
        }
        loadingMessage="Loading revenue data.."
        errorMessage="Error loading revenue data. Please try again."
        emptyStateMessage="No revenue data available for this period"
        compareEmptyMessage="Please select start and end dates to compare progress"
        isTransactionalBusiness={isTransactionalBusiness}
      />
    );
  } else {
    // Default fallback (could be a message or a different template)
    return (
      <div className="p-8 text-center text-gray-500">
        No sales and revenue data available for your business type.
      </div>
    );
  }
}
