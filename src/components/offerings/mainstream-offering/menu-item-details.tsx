"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IBusiness } from "@/types/auth-types";
import { Clock, DollarSign, Edit, Star, Tag, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_urls?: string[];
  description: string | null;
  preparation_time?: number; // Preparation time in minutes
  business?: IBusiness;
}

interface MenuItemDetailsProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string, name: string) => void;
}

export default function MenuItemDetails({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MenuItemDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!item) return null;

  // Format price to Nigerian Naira
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const handleMakePopular = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${item.name} marked as popular`);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Image */}
          {item.image_urls && item.image_urls.length > 0 ? (
            <div className="relative rounded-md overflow-hidden h-48">
              <Image
                src={item.image_urls[0] || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-full object-cover"
                width={300}
                height={300}
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-md h-48 flex items-center justify-center">
              <p className="text-gray-500">No image available</p>
            </div>
          )}

          {/* Item Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-1 rounded">
                {formatPrice(item.price)}
              </span>
            </div>

            {item.description && (
              <p className="text-gray-600">{item.description}</p>
            )}

            {/* Item Stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Popular choice</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  Prep:{" "}
                  {item.preparation_time
                    ? `${item.preparation_time} mins`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm">High profit</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                <Tag className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Seasonal</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onDelete(item.id, item.name)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 mt-2"
            onClick={handleMakePopular}
            disabled={isLoading}
          >
            <Star className="h-4 w-4 mr-2" />
            {isLoading ? "Processing..." : "Mark as popular"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
