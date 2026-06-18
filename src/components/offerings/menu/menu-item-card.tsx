import React from "react";
import { Edit, Trash2, Zap } from "lucide-react";
import { MenuItem } from "./types";
import { formatPrice } from "./menu-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  onPromote?: (item: MenuItem) => void;
  isPromoted?: boolean;
  timeRemaining?: string;
}

function getLowestQuantityOptionPrice(quantityOptions?: Array<{ label: string; price: number }>): number | null {
  if (!quantityOptions || quantityOptions.length === 0) return null;
  return Math.min(...quantityOptions.map(opt => opt.price));
}

function getDiscountedPrice(discount_price?: string | number): number | null {
  if (!discount_price && discount_price !== 0) return null;
  const price = typeof discount_price === 'string' ? parseFloat(discount_price) : discount_price;
  return isNaN(price) ? null : price;
}

export function MenuItemCard({ item, onEdit, onDelete, onPromote, isPromoted, timeRemaining }: MenuItemCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md border-2 border-gray-200" style={isPromoted ? { borderColor: "#F97316" } : {}}>
      <CardContent className="p-2">
        <div className="space-y-4 grid grid-rows-2">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
              </div>
              {item.quantityOptions && item.quantityOptions.length > 0 ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">Before MyPal:</span>
                    <Badge variant="outline" className="bg-secondary">
                      From {formatPrice(getLowestQuantityOptionPrice(item.quantityOptions) || 0)}
                    </Badge>
                  </div>
                  {getDiscountedPrice(item.discount_price) !== null ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">After MyPal:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        From {formatPrice(getDiscountedPrice(item.discount_price) || 0)}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">Before MyPal:</span>
                    <Badge variant="outline" className="bg-secondary">
                      {formatPrice(item.price || 0)}
                    </Badge>
                  </div>
                  {getDiscountedPrice(item.discount_price) !== null ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">After MyPal:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {formatPrice(getDiscountedPrice(item.discount_price) || 0)}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {item.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {item.description}
              </p>
            )}
          </div>

          {/* opacity-0 group-hover:opacity-100 transition-opacity */}
          <div className="flex items-center gap-1 flex-wrap">
            {onPromote && (
              isPromoted ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-xs font-semibold bg-white text-green-800 border-green-800 cursor-default"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Promoted
                  </Button>
                  {timeRemaining && (
                    <Badge variant="soft-default" className="bg-green-100 text-green-700 border-green-300 text-xs">
                      {timeRemaining} remaining
                    </Badge>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPromote(item)}
                  className="text-xs font-medium text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Promote
                </Button>
              )
            )}

            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                Edit <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
