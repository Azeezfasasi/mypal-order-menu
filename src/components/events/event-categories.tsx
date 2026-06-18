"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventCategory } from "@/types/events";

interface EventCategoriesProps {
  categories: EventCategory[];
}

export default function EventCategories({ categories }: EventCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([
    1, 2, 3, 4,
  ]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-orange-600 font-bold">
          Event categories
        </CardTitle>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add category
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center justify-between bg-[#FFF7F5] rounded-sm px-3">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleCategory(category.id)}
              >
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="h-4 w-4 text-orange-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-orange-600" />
                )}
                <span className="font-sora font-medium text-gray-700">
                  {category.name}
                </span>
              </div>
              <Button
                variant="link"
                className="text-gray-600 hover:text-gray-800"
              >
                view
              </Button>
            </div>
            {expandedCategories.includes(category.id) && (
              <div className="flex flex-wrap gap-2 ml-6">
                {category.events.map((event, index) => (
                  <Badge
                    key={index}
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    {event}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
