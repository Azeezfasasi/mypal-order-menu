import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { ChevronDown, Plus, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useMemo } from "react";
import PromoteItemModal from "@/components/PromoteBusiness";
import { PromotionsApi, type PromotionType } from "@/services/api/promotions-api";
import { categoryConfigs, palettes } from "./category-config";
import { BuffetCategoryUI } from "./data-transformers";
import { TimeRemaining } from "@/services/api/promotions-api";

interface CategorySectionProps {
  category: BuffetCategoryUI;
  onEditSubCategory: (categoryId: string, subCategoryId: string) => void;
  onDeleteSubCategory: (categoryId: string, subCategoryId: string) => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (subCategoryId: string) => void;
  onAddCategory: (categoryId: string) => void;
  onAddSubCategory: (parentSubCategoryId: string) => void;
  onCreateOffer?: (categoryId: string) => void;
}

export default function CategorySection({
  category,
  onEditSubCategory,
  onDeleteSubCategory,
  onEditItem,
  onDeleteItem,
  onAddItem,
  // onAddCategory,
  onAddSubCategory,
  onCreateOffer,
}: CategorySectionProps) {
  const config = categoryConfigs[category.categoryType] || { palette: "warm" as const };
  const palette = palettes[(config?.palette as keyof typeof palettes) || "warm"];
  const [expandedSubCategories, setExpandedSubCategories] = useState<
    Set<string>
  >(new Set());

  // Promote modal state - for promoting subcategories (meals)
  const [promoteModalState, setPromoteModalState] = useState<{
    isOpen: boolean;
    subCategoryId: string;
    promotionType?: PromotionType;
  }>({
    isOpen: false,
    subCategoryId: "",
  });

  // Fetch promotions to check promoted status
  const { data: promotionsResponse } = PromotionsApi.useListPromotions();
  const promotedCategoryData = useMemo(() => {
    if (!promotionsResponse?.data) return new Map<string, TimeRemaining>();
    const map = new Map<string, TimeRemaining>();
    promotionsResponse.data
      .filter((p) => p.status?.toLowerCase() === "active")
      .forEach((p) => {
        // Handle service_category promotions (buffet_meal subcategories)
        if (p.promotion_type === "service_category" && p.service_category?.id) {
          const id = p.service_category.id;
          if (p.time_remaining) {
            map.set(id, p.time_remaining);
          }
        }
        // Handle service_item promotions (individual items)
        if (p.promotion_type === "service_item" && p.service_item?.id) {
          const id = p.service_item.id;
          if (p.time_remaining) {
            map.set(id, p.time_remaining);
          }
        }
      });
    return map;
  }, [promotionsResponse?.data]);

  // Helper function to format time remaining
  const formatTimeRemaining = (timeRemaining: TimeRemaining): string => {
    const { days = 0, hours = 0, minutes = 0 } = timeRemaining;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  };

  const toggleSubCategory = (subCategoryId: string) => {
    setExpandedSubCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subCategoryId)) {
        newSet.delete(subCategoryId);
      } else {
        newSet.add(subCategoryId);
      }
      return newSet;
    });
  };

  const renderSubCategoryHeader = (
    subCategory: BuffetCategoryUI["subCategories"][0],
    isFirst: boolean = false,
    isLast: boolean = false,
    isNested: boolean = false,
    currentDepth: number = 0,
  ) => {
    const bgStyle = subCategory.imageUrl
      ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${subCategory.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

    const hasItems = subCategory.items && subCategory.items.length > 0;
    const hasNestedSubCategories =
      subCategory.subCategories && subCategory.subCategories.length > 0;
    const isExpandable = hasItems || hasNestedSubCategories;
    const isExpanded = expandedSubCategories.has(subCategory.id);

    // Check if we can add more nesting based on maxNestingDepth
    const canAddMoreNesting =
      config?.maxNestingDepth === undefined ||
      config?.maxNestingDepth === null ||
      currentDepth < config?.maxNestingDepth;

    // Dynamic border radius based on position
    const borderRadiusClass = !isNested
      ? isFirst && isLast
        ? "rounded-b-lg" // Only subcategory
        : isFirst
          ? "rounded-t-none" // First of multiple
          : isLast && !isExpanded
            ? "rounded-b-lg rounded-t-none" // Last of multiple, not expanded
            : "rounded-none" // Middle subcategory
      : "rounded-lg"; // Nested subcategories are always fully rounded

    return (
      <div
        className={cn(
          "relative transition-colors duration-200",
          subCategory.imageUrl
            ? "text-white"
            : isNested
              ? "bg-gray-100 text-gray-700"
              : ["text-gray-100", config?.headerColor],
          borderRadiusClass,
          isExpandable ? "cursor-pointer hover:opacity-90" : "",
          isNested ? "mb-2" : "",
        )}
        style={bgStyle}
        onClick={
          isExpandable ? () => toggleSubCategory(subCategory.id) : undefined
        }
      >
        {/* Dark overlay for background images */}
        {subCategory.imageUrl && (
          <div
            className={cn(
              "absolute inset-0 bg-black/50 -z-10",
              borderRadiusClass,
            )}
          />
        )}

        <div
          className={cn(
            "flex items-center justify-between relative z-10 md:flex-wrap md:gap-2",
            isNested ? "p-3" : "p-4",
          )}
        >
          {/* Buffet meal section */}
          <div className="flex md:flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              {isExpandable && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 text-white",
                    isExpanded ? "transform rotate-180" : "",
                    subCategory.imageUrl ? "text-white" : "text-gray-600",
                  )}
                />
              )}
              <h3
                className={cn(
                  "font-medium",
                  isNested ? "text-base" : "text-lg",
                )}
              >
                {subCategory.name}
              </h3>
            </div>
            {category.categoryType === "buffet_meal" && (
              <div className="flex gap-2">
                <Badge variant={"soft-default"}>
                  {formatCurrency(subCategory.pricePerAdult || 0)} per Adult
                </Badge>
                <Badge variant={"soft-default"}>
                  {formatCurrency(subCategory.pricePerChild || 0)} per Child
                </Badge>
              </div>
            )}
            {subCategory.isDefault && (
              <Badge
                variant="soft-default"
                className="bg-blue-100 text-blue-700 border-blue-200"
              >
                Default
              </Badge>
            )}
          </div>
          <div className="flex md:mx-auto gap-2 md:mt-2" onClick={(e) => e.stopPropagation()}>
            {/* Promote button - only shown for top-level buffet_meal categories without nested subcategories and not default */}
            {category.categoryType === "buffet_meal" && !isNested && !hasNestedSubCategories && !subCategory.isDefault && (
              promotedCategoryData.has(subCategory.id) ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-xs font-medium bg-white text-green-600 border-green-600 cursor-default"
                  >
                    Promoted
                  </Button>
                  <Badge variant="soft-default" className="bg-green-100 text-green-700 border-green-200 text-xs">
                    {formatTimeRemaining(promotedCategoryData.get(subCategory.id)!)} remaining
                  </Badge>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium text-orange-600 border-orange-600 hover:bg-orange-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPromoteModalState({
                      isOpen: true,
                      subCategoryId: subCategory.id,
                      promotionType: "service_category",
                    });
                  }}
                >
                  Promote
                </Button>
              )
            )}

            {/* Show Add Subcategory button if this subcategory can have nested subcategories */}
            {hasNestedSubCategories &&
              config?.canAddSubcategory &&
              canAddMoreNesting && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 text-xs border-blue-600 hover:bg-blue-50"
                  onClick={() => onAddSubCategory(subCategory.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subcategory
                </Button>
              )}
            {/* Show Add Item button only if no nested subcategories and can add items */}
            {!hasNestedSubCategories && config?.canAddItem && (
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 text-xs border-orange-600 hover:bg-orange-50"
                onClick={() => onAddItem(subCategory.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            )}
            {/* Show edit button based on config, but for BUFFET_MEAL allow editing default subcategories for pricing */}
            {config?.canEditSubcategory &&
              (category.categoryType === "buffet_meal" ||
                !subCategory.isDefault) && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs text-black",
                    subCategory.imageUrl &&
                      "bg-white/20 border-white/30 text-white hover:bg-white/30",
                  )}
                  onClick={() => onEditSubCategory(category.id, subCategory.id)}
                >
                  Edit
                </Button>
              )}
            {/* Only show delete button if not a default subcategory and delete is allowed */}
            {config?.canDeleteSubcategory && !subCategory.isDefault && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-red-600 text-xs",
                  subCategory.imageUrl &&
                    "bg-white/20 border-white/30 text-red-200 hover:bg-white/30",
                )}
                onClick={() => onDeleteSubCategory(category.id, subCategory.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sub category content renderer - handles both items and nested subcategories recursively
  const renderSubCategoryContent = (
    subCategory: BuffetCategoryUI["subCategories"][0],
    isNested: boolean = false,
    currentDepth: number = 0,
  ) => {
    const isExpanded = expandedSubCategories.has(subCategory.id);
    const hasItems = subCategory.items && subCategory.items.length > 0;
    const hasNestedSubCategories =
      subCategory.subCategories && subCategory.subCategories.length > 0;

    // Check if we can add more nesting based on maxNestingDepth
    const canAddMoreNesting =
      config?.maxNestingDepth === undefined ||
      config?.maxNestingDepth === null ||
      currentDepth < config?.maxNestingDepth;

    if (!isExpanded) return null;

    return (
      <div
        className={cn(
          palette?.subBgClass || "bg-white",
          isNested ? "rounded-lg mt-2" : "",
        )}
      >
        {/* Render nested subcategories first */}
        {hasNestedSubCategories && (
          <div className={cn("space-y-2", isNested ? "p-3" : "px-2 pt-2")}>
            {subCategory.subCategories!.map((deepSubCategory) => (
              <div key={deepSubCategory.id}>
                {renderSubCategoryHeader(
                  deepSubCategory,
                  false,
                  false,
                  true,
                  currentDepth + 1,
                )}
                {renderSubCategoryContent(
                  deepSubCategory,
                  true,
                  currentDepth + 1,
                )}
              </div>
            ))}
            {/* Add Subcategory button at the bottom when nested subcategories exist */}
            {config?.canAddSubcategory && canAddMoreNesting && (
              <div className="px-2 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={() => onAddSubCategory(subCategory.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subcategory
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Render items */}
        {hasItems && renderItems(subCategory, isNested)}
      </div>
    );
  };

  // Special offerings renderer for buffet meal items with price per adult/child and promotion options
  const renderItems = (
    subCategory: BuffetCategoryUI["subCategories"][0],
    isNested: boolean = false,
  ) => (
    <div
      className={cn(
        palette?.subBgLightClass || "bg-white",
        isNested ? "rounded-lg" : "flex flex-col md:justify-center md:items-center md:gap-4 md:p-4",
      )}
    >
      {subCategory.items.length === 0 ? (
        <div className="p-4 text-center space-y-3">
          <p className="text-gray-400 italic">
            No items found in this subcategory.
          </p>
          {config?.canAddItem && (
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
              onClick={() => onAddItem(subCategory.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Special Offer for Buffet Meal */}
          {subCategory.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex md:flex-col items-center justify-between gap-4 p-4 border-b rounded-b-sm mb-[2px]",
                palette?.subBgLightClass || "bg-orange-100",
                "last:border-b-0" ,
                palette?.borderClass || "border-gray-100",
                isNested ? "ml-3" : "ml-3",
              )}
            >
              {/* Item image thumbnail if available */}
              {item.imageUrls && item.imageUrls.length > 0 && (
                <div className="flex-shrink-0 relative w-16 h-16">
                  <Image
                    src={item.imageUrls[0]}
                    alt={item.name}
                    fill
                    className="object-cover rounded-md border border-gray-200"
                    sizes="64px"
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  {item.price && (
                    <span className="text-orange-500 font-medium">
                      {formatCurrency(item.price)} per person
                    </span>
                  )}
                  {item.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {/* Promote button for individual items - only for non-buffet_meal categories and not default */}
                {category.categoryType !== "buffet_meal" && !item.isDefault && (
                  promotedCategoryData.has(item.id) ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs font-medium bg-white text-green-600 border-green-600 cursor-default"
                      >
                        Promoted
                      </Button>
                      <Badge variant="soft-default" className="bg-green-100 text-green-700 border-green-200 text-xs">
                        {formatTimeRemaining(promotedCategoryData.get(item.id)!)} remaining
                      </Badge>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-medium text-orange-600 border-orange-600 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPromoteModalState({
                          isOpen: true,
                          subCategoryId: item.id,
                          promotionType: "service_item",
                        });
                      }}
                    >
                      Promote
                    </Button>
                  )
                )}
                {/* Only show edit button if not a default item and edit is allowed */}
                {config?.canEditItem && !item.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("text-xs")}
                    onClick={() => onEditItem?.(item.id)}
                  >
                    Edit
                  </Button>
                )}
                {/* Only show delete button if not a default item and delete is allowed */}
                {config?.canDeleteItem && !item.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("text-red-600 text-xs")}
                    onClick={() => onDeleteItem?.(item.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {/* Add Item button at the bottom when items exist */}
          {config?.canAddItem && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 md:rounded-md">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-orange-600 border-orange-600 hover:bg-orange-50"
                onClick={() => onAddItem(subCategory.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <Accordion type="single" collapsible className="mb-6">
      <AccordionItem
        value={category.id}
        className={`overflow-hidden shadow-sm border-0 rounded-lg ${
          category.categoryType === "buffet_addon" ? "px-1" : ""
        }`}
      >
        <div className="relative">
          <AccordionTrigger
            className={`hover:no-underline group data-[state=open]:rounded-b-none data-[state=closed]:rounded-lg transition-all duration-200 pr-2 pl-2 ${
              category.imageUrl
                ? "overflow-hidden"
                : // use palette headerClass when available, else fallback to config.gradient
                  palettes[(config?.palette as keyof typeof palettes) || "warm"]
                    ?.headerClass || config?.gradient
            }`}
            chevronClassName="text-white group-hover:text-orange-300 size-7"
            style={
              category.imageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${category.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {}
            }
          >
            <h2 className="text-2xl md:text-xl font-sora font-medium text-white flex-1">
              {category.name}
            </h2>
          </AccordionTrigger>
          {category.categoryType === "special_offer" && onCreateOffer && (
            <Button
              className="absolute top-1/2 right-12 md:right-8 -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white text-sm z-20 md:text-[12px] md:px-1"
              onClick={(e) => {
                e.stopPropagation();
                onCreateOffer(category.id);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Offer
            </Button>
          )}
        </div>
        <AccordionContent className="p-0 bg-white rounded-b-lg overflow-hidden">
          {category.subCategories.length === 0 && (!category.items || category.items.length === 0) ? (
            <div className="p-6 text-gray-400 italic text-center">
              No subcategories found in this category.
            </div>
          ) : (
            <>
              {/* Render direct items on category (e.g., special offers) */}
              {category.items && category.items.length > 0 && (
                <div className={cn(palette?.subBgLightClass || "bg-white")}>
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex md:flex-col items-center justify-between gap-4 p-4 border-b rounded-b-sm mb-[2px]",
                        palette?.subBgLightClass || "bg-orange-100",
                        "last:border-b-0",
                        palette?.borderClass || "border-gray-100",
                      )}
                    >
                      {item.backgroundImageUrl && (
                        <div className="w-24 h-24 relative rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={item.backgroundImageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.price && (
                          <p className="font-semibold text-orange-600 mt-2">₦{item.price}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditItem(item.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Render subcategories */}
              {category.subCategories.map((subCategory, index) => {
                const isFirst = index === 0;
                const isLast = index === category.subCategories.length - 1;

                return (
                  <div key={subCategory.id}>
                    {renderSubCategoryHeader(subCategory, isFirst, isLast)}
                    {renderSubCategoryContent(subCategory)}
                  </div>
                );
              })}
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    {/* Promote Meal Modal */}
    {promoteModalState.isOpen && (
      <PromoteItemModal
        isOpen={promoteModalState.isOpen}
        onClose={() => setPromoteModalState({ isOpen: false, subCategoryId: "" })}
        itemId={promoteModalState.subCategoryId}
        promotionType={promoteModalState.promotionType || "service_category"}
      />
    )}
    </>
  );
}
