import { RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export interface MetricCardProps {
  title: string;
  value: string;
  period: string;
  isLoading?: boolean;
}

export const MetricCard = ({
  title,
  value,
  period,
  isLoading,
}: MetricCardProps) => {
  return (
    <Card className="bg-[#001529] text-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm">{title}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 bg-white/10 border-none text-white hover:bg-white/20"
          >
            {period}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold font-sora">
            {isLoading ? "..." : value}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
