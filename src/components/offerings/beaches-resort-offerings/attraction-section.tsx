"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Attraction } from "@/types/beaches-resort";

interface AttractionsSectionProps {
  attractions: Attraction[];
}

export default function AttractionsSection({
  attractions,
}: AttractionsSectionProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">
          ⭐ Resort attractions
        </CardTitle>
        <Button className="bg-white text-amber-600 hover:bg-amber-50 font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          Add Attraction
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {attractions.map((attraction, index) => (
          <div
            key={attraction.id}
            className={`flex items-center justify-between py-4 px-4 rounded-lg ${
              index % 2 === 0 ? "bg-amber-50" : "bg-orange-50"
            }`}
          >
            <span className="font-medium text-gray-700">{attraction.name}</span>
            <div className="flex items-center gap-4">
              <Switch
                checked={attraction.enabled}
                className="data-[state=checked]:bg-green-600"
              />
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </Button>
              <Button
                variant="link"
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
