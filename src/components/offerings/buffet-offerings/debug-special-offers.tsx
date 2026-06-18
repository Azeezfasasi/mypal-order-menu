"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/services/api/api-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import { useState } from "react";

interface DebugInfo {
  error?: string;
  specialOffersCategoryId?: string;
  categoryName?: string;
  itemsInCategory?: number;
  itemsViaDedicatedEndpoint?: number;
  directItems?: unknown[];
  dedicatedItems?: unknown[];
  allCategoriesWithItems?: Array<{
    categoryId: unknown;
    categoryName: unknown;
    categoryType: unknown;
    itemsCount: number;
  }>;
}

export function DebugSpecialOffers() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSpecialOffers = async () => {
    setLoading(true);
    try {
      // Get Special Offers category ID first
      const menusResponse = await apiClient.get(ENDPOINTS.SERVICE_OFFERING.GET_BUSINESS_MENUS);
      const specialOffersCategory = menusResponse.data.data?.find(
        (c: Record<string, unknown>) => c.category_type === "special_offer"
      );

      console.log("📊 Debug Info:", {
        categories: menusResponse.data.data,
        specialOffersCategory,
      });

      // Also try to get ALL items across all categories to see where items went
      const allItemsFromAllCategories: Array<{
        categoryId: unknown;
        categoryName: unknown;
        categoryType: unknown;
        itemsCount: number;
      }> = [];
      menusResponse.data.data?.forEach((cat: Record<string, unknown>) => {
        if (
          (cat as { items?: unknown[] }).items &&
          Array.isArray((cat as { items?: unknown[] }).items) &&
          (cat as { items?: unknown[] }).items!.length > 0
        ) {
          allItemsFromAllCategories.push({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryType: cat.category_type,
            itemsCount: ((cat as { items?: unknown[] }).items as unknown[]).length,
          });
        }
      });

      if (specialOffersCategory) {
        // Check both endpoints
        const directItems = (specialOffersCategory as { items?: unknown[] }).items || [];

        // Try to fetch items via the dedicated endpoint
        let dedicatedItems: unknown[] = [];
        try {
          const itemsResponse = await apiClient.get(
            ENDPOINTS.BUFFET_OFFERINGS.GET_BY_CATEGORY(
              (specialOffersCategory as { id: string }).id
            )
          );
          dedicatedItems = itemsResponse.data.data || [];
        } catch (e) {
          console.error("Failed to fetch items from dedicated endpoint:", e);
        }

        setDebugInfo({
          specialOffersCategoryId: (specialOffersCategory as { id: string }).id,
          categoryName: (specialOffersCategory as { name: string }).name,
          itemsInCategory: (directItems as unknown[]).length,
          itemsViaDedicatedEndpoint: dedicatedItems.length,
          directItems: directItems as unknown[],
          dedicatedItems: dedicatedItems,
          allCategoriesWithItems: allItemsFromAllCategories,
        });
      } else {
        setDebugInfo({ error: "Special Offers category not found" });
      }
    } catch (error) {
      setDebugInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 border-red-300 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-700">🐛 Debug: Special Offers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkSpecialOffers}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading ? "Checking..." : "Check Backend Items"}
        </Button>

        {debugInfo && (
          <div className="bg-white p-4 rounded border border-red-200 text-sm font-mono overflow-auto max-h-96">
            {debugInfo.error ? (
              <div className="text-red-600">❌ Error: {debugInfo.error}</div>
            ) : (
              <div className="space-y-2">
                <div>
                  <strong>Category ID:</strong> {debugInfo.specialOffersCategoryId}
                </div>
                <div>
                  <strong>Category Name:</strong> {debugInfo.categoryName}
                </div>
                <div className="bg-yellow-50 p-2 border border-yellow-200 rounded">
                  <strong>📋 Items in /business/menus category.items:</strong>{" "}
                  <span
                    className={
                      (debugInfo.itemsInCategory || 0) > 0
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {debugInfo.itemsInCategory || 0}
                  </span>
                </div>
                <div className="bg-blue-50 p-2 border border-blue-200 rounded">
                  <strong>📋 Items via /buffet-offerings/category/:id:</strong>{" "}
                  <span
                    className={
                      (debugInfo.itemsViaDedicatedEndpoint || 0) > 0
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {debugInfo.itemsViaDedicatedEndpoint || 0}
                  </span>
                </div>

                {(debugInfo.allCategoriesWithItems?.length || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200 bg-orange-50 p-2 rounded">
                    <strong className="text-orange-700">
                      ⚠️ Items found in OTHER categories:
                    </strong>
                    <ul className="text-orange-600 mt-2">
                      {debugInfo.allCategoriesWithItems?.map((cat) => (
                        <li key={String(cat.categoryId)}>
                          • {String(cat.categoryName)} ({String(cat.categoryType)}
                          ): <strong>{cat.itemsCount} items</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(debugInfo.directItems?.length || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <strong>Items in category:</strong>
                    <pre className="text-xs overflow-auto mt-2 bg-gray-100 p-2 rounded">
                      {JSON.stringify(debugInfo.directItems, null, 2)}
                    </pre>
                  </div>
                )}

                {(debugInfo.dedicatedItems?.length || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <strong>Items from dedicated endpoint:</strong>
                    <pre className="text-xs overflow-auto mt-2 bg-gray-100 p-2 rounded">
                      {JSON.stringify(debugInfo.dedicatedItems, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
