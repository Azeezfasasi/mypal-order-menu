import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { BusinessContextApi } from "@/services/api/business-context-api";
import type { IStoredBusiness } from "@/stores/auth-store";
import { TokenType, useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function BusinessSwitcher() {
  const { user: business } = useAuth();
  const storeActions = useAuthStore((s) => s.actions);
  const { mutate: switchBusiness } = BusinessContextApi.useSwitchBusiness();
  const { mutate: addCategory } = BusinessContextApi.useAddCategory();

  type LinkedBiz = NonNullable<IStoredBusiness["linkedBusinesses"]>[number];
  type AvailableCategory = NonNullable<
    IStoredBusiness["available_categories"]
  >[number];

  const linked = (business?.linkedBusinesses || []).map((b: LinkedBiz) => ({
    id: b.id,
    name: b.business_name,
    categoryName: b.category?.name,
    categoryId: b.category?.id,
    is_primary: b.is_primary,
  }));

  const available = (business?.available_categories || []).map(
    (c: AvailableCategory) => ({
      id: c.id,
      name: c.name,
      image_url: c.image_url,
    }),
  );

  const handleSwitch = (businessId: string) => {
    switchBusiness(
      { businessId },
      {
        onSuccess: (res) => {
          // If backend returned access_token + business, update auth state
          if (res.data?.access_token && res.data?.business) {
            // Normalize incoming business payload so it matches IStoredBusiness expectations
            const incomingBiz = res.data.business;
            const normalizedBiz = incomingBiz
              ? ({
                  ...incomingBiz,
                  // Backend may return `null` for available_categories; store expects array | undefined
                  available_categories:
                    incomingBiz.available_categories ?? undefined,
                } as unknown as IStoredBusiness)
              : null;

            // Set session in the global auth store so cookies and state are updated
            try {
              storeActions.setSession(
                res.data.access_token,
                TokenType.AUTHENTICATED,
                normalizedBiz,
              );
            } catch {
              // Fallback: update business only
              storeActions.updateBusiness(
                normalizedBiz as Partial<IStoredBusiness>,
              );
            }
          }
        },
      },
    );
  };

  const handleAddCategory = (categoryId: string) => {
    addCategory(
      { categoryId },
      {
        onSuccess: (res) => {
          const newBizId =
            res?.data?.newBusiness?.id || res?.data?.existingBusiness?.id;
          if (newBizId) {
            // After backend created business, immediately switch into it
            handleSwitch(newBizId);
          } else {
            toast.success(
              res.message || "Category added — check your businesses",
            );
          }
        },
      },
    );
  };

  if (!business) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">Switch Business</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {linked.length === 0 && (
          <DropdownMenuItem disabled>No linked businesses</DropdownMenuItem>
        )}
        {linked.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => handleSwitch(b.id)}>
            <div className="flex flex-col">
              <span>
                {b.name} {b.is_primary ? "(Primary)" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {b.categoryName}
              </span>
            </div>
          </DropdownMenuItem>
        ))}

        {available.length > 0 && <DropdownMenuSeparator />}
        {available.map((c) => {
          const already = linked.find((l) => l.categoryId === c.id);
          return (
            <DropdownMenuItem
              key={c.id}
              onClick={() =>
                already ? handleSwitch(already.id) : handleAddCategory(c.id)
              }
              disabled={!!already}
            >
              <div className="flex flex-col">
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  Add new business for this category
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default BusinessSwitcher;
