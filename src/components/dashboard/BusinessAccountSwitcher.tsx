"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, TokenType, type IStoredBusiness } from "@/stores/auth-store";
import { BusinessContextApi } from "@/services/api/business-context-api";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LinkedBusiness = NonNullable<IStoredBusiness["linkedBusinesses"]>[number];

interface AccountSwitcherProps {
  onSwitch?: (accountId: string) => void;
}

export default function AccountSwitcher({ onSwitch }: AccountSwitcherProps) {
  const current = useAuthStore((s) => s.business);
  const storeActions = useAuthStore((s) => s.actions);
  const { mutate: switchBusiness } = BusinessContextApi.useSwitchBusiness();
  const router = useRouter();

  const [cachedLinkedBusinesses, setCachedLinkedBusinesses] = useState<LinkedBusiness[]>(
    current?.linkedBusinesses ?? [],
  );

  useEffect(() => {
    const currentLinked = Array.isArray(current?.linkedBusinesses)
      ? current.linkedBusinesses
      : undefined;

    if (currentLinked && currentLinked.length > 0) {
      setCachedLinkedBusinesses(currentLinked);
    }
  }, [current?.linkedBusinesses]);

  const currentLinkedBusinesses = Array.isArray(current?.linkedBusinesses)
    ? current.linkedBusinesses
    : undefined;

  const linkedBusinesses: LinkedBusiness[] = currentLinkedBusinesses &&
    currentLinkedBusinesses.length > 0
    ? currentLinkedBusinesses
    : cachedLinkedBusinesses.length > 0
    ? cachedLinkedBusinesses
    : current
    ? ([
        {
          id: current.id,
          business_name: current.business_name ?? "",
          image_url: current.image_url ?? undefined,
          category: {
            id: current.category?.id ?? "",
            name: current.category?.name ?? "",
          },
          is_primary: true,
        },
      ] as LinkedBusiness[])
    : [];

  const currentCategory = current?.category?.name ?? current?.business_name ?? "Select category";

  function handleSwitch(id: string) {
    if (onSwitch) {
      onSwitch(id);
      return;
    }

    switchBusiness(
      { businessId: id },
      {
        onSuccess: (res) => {
          if (res.data?.access_token && res.data?.business) {
            const incomingBiz = res.data.business;
            const normalizedBiz = incomingBiz
              ? ({
                  ...incomingBiz,
                  available_categories:
                    incomingBiz.available_categories ?? undefined,
                  linkedBusinesses:
                    res.data.linkedBusinesses?.length
                      ? res.data.linkedBusinesses
                      : current?.linkedBusinesses,
                } as IStoredBusiness)
              : null;

            try {
              storeActions.setSession(
                res.data.access_token,
                TokenType.AUTHENTICATED,
                normalizedBiz,
              );
            } catch {
              storeActions.updateBusiness(normalizedBiz as Partial<IStoredBusiness>);
            }

            router.refresh();
          }
        },
      },
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-1 text-[10px] font-bold leading-[15px] text-[#6B7280] uppercase">
        SELECT CATEGORY
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label="Select business category"
            className="flex w-full items-center justify-between rounded-[18px] border border-orange-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <span>{currentCategory}</span>
            <ChevronDown className="h-4 w-4 text-orange-500" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-full min-w-[440px] md:min-w-[300px] border border-[#E5E7EB] bg-white shadow-lg">
          {linkedBusinesses.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500 text-center">
              No business categories available
            </div>
          ) : (
            <>
              {linkedBusinesses.map((business) => {
                const label = business.category?.name || business.business_name || "Category";
                const isActive = business.id === current?.id;

                return (
                  <DropdownMenuItem
                    key={business.id}
                    onSelect={() => handleSwitch(business.id)}
                    className="rounded-2xl px-4 py-3 hover:bg-orange-50 focus:bg-orange-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-sm font-semibold ${isActive ? "text-orange-600" : "text-slate-900"}`}>
                          {label}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {business.business_name}
                        </div>
                      </div>
                      {isActive && <div className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Active</div>}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
