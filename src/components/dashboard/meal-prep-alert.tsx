import React from "react";
import { AlertCircle } from "lucide-react";

interface MealPrepAlertProps {
  title: string;
  description: string;
}

export function MealPrepAlert({ title, description }: MealPrepAlertProps) {
  return (
    <div className="bg-[#FEF2EE] flex items-center justify-start border border-orange-200 rounded-[10px] p-2 gap-3 my-2">
        <div className="bg-[#F8C8B8] p-1.75 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-5 text-orange-600 shrink-0 mt-0.5" />
        </div>
        <div>
            <h3 className="font-semibold text-[#DB3A07] md:text-[14.72px] text-[16px] leading-[29.44px]">{title}</h3>
            <p className="md:text-[12px] text-[14px] font-medium leading-[29.44px] text-[#68798A] -mt-0.75">{description}</p>
        </div>
    </div>
  );
}
