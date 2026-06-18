import { BusinessCategoryType } from "@/types/enums";

/**
 * Normalize a business category string and map it to a BusinessCategoryType enum value.
 * Returns undefined if no match is found.
 */
export function mapBusinessCategory(
  rawCategory: string | undefined | null,
): BusinessCategoryType | undefined {
  if (!rawCategory) return undefined;
  const normalized = String(rawCategory)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const categoryMap: Record<string, BusinessCategoryType | undefined> = {
    // Mainstream / Restaurants
    mainstream: BusinessCategoryType.MAINSTREAM,
    "main stream": BusinessCategoryType.MAINSTREAM,

    // Iconic Delicacies variants
    iconicdelicacies: BusinessCategoryType.ICONICDELICACIES,
    "iconic delicacies": BusinessCategoryType.ICONICDELICACIES,
    "iconic-delicacies": BusinessCategoryType.ICONICDELICACIES,

    // Fine Dining variants
    "fine dining": BusinessCategoryType.FINEDINING,
    finedining: BusinessCategoryType.FINEDINING,
    "fine-dining": BusinessCategoryType.FINEDINING,

    // Salons & Spa variants
    "salons and spa": BusinessCategoryType.SALONSANDSPA,
    salonsandspa: BusinessCategoryType.SALONSANDSPA,
    "salon and spa": BusinessCategoryType.SALONSANDSPA,
    "salon spa": BusinessCategoryType.SALONSANDSPA,

    // Buffet
    "buffet services": BusinessCategoryType.BUFFET,
    buffet: BusinessCategoryType.BUFFET,

    // Beaches & Resorts variants (normalize & and other punctuation)
    "beaches resorts": BusinessCategoryType.BEACHESRESORTS,
    "beaches & resorts": BusinessCategoryType.BEACHESRESORTS,
    beachesandresorts: BusinessCategoryType.BEACHESRESORTS,
    "beach resorts": BusinessCategoryType.BEACHESRESORTS,
    "beach resort": BusinessCategoryType.BEACHESRESORTS,

    // Boat and Yachts / Cruises variants
    "boat and yachts cruises": BusinessCategoryType.BOATYATCHCRUISE,
    "boat and yacht cruises": BusinessCategoryType.BOATYATCHCRUISE,
    "boat yacht cruise": BusinessCategoryType.BOATYATCHCRUISE,
    "boat yachts cruise": BusinessCategoryType.BOATYATCHCRUISE,
    "boat and yachts": BusinessCategoryType.BOATYATCHCRUISE,
    "boat yachts": BusinessCategoryType.BOATYATCHCRUISE,
    boatyatchcruise: BusinessCategoryType.BOATYATCHCRUISE,

    // Short-let homes variants
    "short let homes": BusinessCategoryType.SHORTLET,
    "short-let homes": BusinessCategoryType.SHORTLET,
    "shortlet homes": BusinessCategoryType.SHORTLET,
    shortlet: BusinessCategoryType.SHORTLET,
    "short let": BusinessCategoryType.SHORTLET,

    // Club
    club: BusinessCategoryType.CLUB,
    clubs: BusinessCategoryType.CLUB,

    // Nightlife Categories
    "bars lounges": BusinessCategoryType.BARSLOUNGES,
    "bars & lounges": BusinessCategoryType.BARSLOUNGES,
    barslounges: BusinessCategoryType.BARSLOUNGES,

    "luxury night": BusinessCategoryType.LUXURYNIGHT,
    luxurynight: BusinessCategoryType.LUXURYNIGHT,

    "food drinks": BusinessCategoryType.FOODDRINKS,
    "food & drinks": BusinessCategoryType.FOODDRINKS,
    fooddrinks: BusinessCategoryType.FOODDRINKS,

    "events nights": BusinessCategoryType.EVENTSNIGHTS,
    eventsnights: BusinessCategoryType.EVENTSNIGHTS,

    "happening this month": BusinessCategoryType.HAPPENINGTHISMONTH,
    happeningthismonth: BusinessCategoryType.HAPPENINGTHISMONTH,

    // Fallbacks: keep original enum display values (normalized)
    [String(BusinessCategoryType.MAINSTREAM).toLowerCase()]:
      BusinessCategoryType.MAINSTREAM,
    [String(BusinessCategoryType.FINEDINING).toLowerCase()]:
      BusinessCategoryType.FINEDINING,
    [String(BusinessCategoryType.SALONSANDSPA).toLowerCase()]:
      BusinessCategoryType.SALONSANDSPA,
    [String(BusinessCategoryType.ICONICDELICACIES).toLowerCase()]:
      BusinessCategoryType.ICONICDELICACIES,
    [String(BusinessCategoryType.BUFFET).toLowerCase()]:
      BusinessCategoryType.BUFFET,
    [String(BusinessCategoryType.BEACHESRESORTS).toLowerCase()]:
      BusinessCategoryType.BEACHESRESORTS,
    [String(BusinessCategoryType.BOATYATCHCRUISE).toLowerCase()]:
      BusinessCategoryType.BOATYATCHCRUISE,
    [String(BusinessCategoryType.SHORTLET).toLowerCase()]:
      BusinessCategoryType.SHORTLET,
    [String(BusinessCategoryType.CLUB).toLowerCase()]:
      BusinessCategoryType.CLUB,
  };

  return categoryMap[normalized];
}
