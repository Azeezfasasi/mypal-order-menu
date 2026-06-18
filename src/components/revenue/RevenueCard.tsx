// components/revenue/RevenueCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface RevenueCardProps {
  title: string;
  amount: number;
  period: string;
  isPrevious?: boolean;
  isLoading?: boolean;
  isTransactionalBusiness?: boolean; // Optional prop to indicate if the business is transactional
}

export function RevenueCard({
  title,
  amount,
  period,
  isPrevious = false,
  isLoading = false,
  isTransactionalBusiness = false, // Default to false if not provided
}: RevenueCardProps) {
  // Different gradient backgrounds for variety
  const cardStyles = isPrevious
    ? "bg-gradient-to-br from-gray-800 to-gray-900"
    : "bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900";

  return (
    <Card
      className={`${cardStyles} text-white overflow-hidden border-0 shadow-lg`}
    >
      <CardContent className="p-6 relative">
        {/* Background pattern/decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/80 text-sm font-medium text-ellipsis line-clamp-1 flex-1">
              {title}
            </p>
            <div className="bg-white/20  px-2 py-1 rounded-full">
              <span className="text-xs font-medium text-white ">{period}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {/* Loading skeleton for amount */}
              <div className="h-12 bg-white/20 rounded animate-pulse w-48"></div>
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm text-white/70">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-2">
                {isTransactionalBusiness ? formatCurrency(amount) : amount}
                <span className="text-white/60 text-2xl">.00</span>
              </h2>

              {/* Optional: Add percentage change or indicator */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white/70">
                  {isPrevious ? "Previous period" : "Current period"}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
