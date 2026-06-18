"use client";

import AddCategoryModal from "@/components/business/AddCategoryModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { ChevronRight, LogOut, Plus, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { useQueryClient } from "@tanstack/react-query";

export interface AccountItem {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string | null;
}

interface AccountSwitcherProps {
  accounts?: AccountItem[];
  onSwitch?: (accountId: string) => void;
  onSignOut?: () => void;
}

export default function AccountSwitcher({
  accounts,
  onSwitch,
  onSignOut,
}: AccountSwitcherProps) {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.actions.clearSession);
  const current = useAuthStore((s) => s.business);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const queryClient = useQueryClient();

  // Use provided accounts or empty array
  const list = accounts || [];

  function handleSignOut() {
    if (onSignOut) {
      onSignOut();
      return;
    }
    // Default sign out behavior
    try {
      clearSession();
    } catch {
      // ignore
    }
    queryClient.removeQueries();
    router.replace("/login");
  }

  function handleSwitch(id: string) {
    // If caller provided a handler, call it. Otherwise, just navigate or update store as placeholder.
    if (onSwitch) {
      onSwitch(id);
      return;
    }

    // Placeholder behaviour: show a small feedback by navigating to root
    router.replace("/");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label="Account menu"
            className="flex items-center gap-2 rounded-full p-1 hover:opacity-90 focus:outline-none"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={current?.image_url || undefined}
                alt={current?.business_name || "Account"}
              />

              <AvatarFallback>
                {(current?.business_name || "").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1">
            <div className="flex items-center gap-3 px-2 py-1">
              <div>
                <div className="text-sm font-semibold">
                  {current?.business_name || "My Account"}
                </div>
                {current?.email && (
                  <div className="text-xs text-muted-foreground">
                    {current.email}
                  </div>
                )}
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => {}}
                  title="Account switcher"
                  className="rounded-md p-1 hover:bg-accent"
                >
                  <Repeat className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="px-2">Switch account</DropdownMenuLabel>

          {list.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No other accounts available
            </div>
          ) : (
            list.map((a) => (
              <DropdownMenuItem key={a.id} onSelect={() => handleSwitch(a.id)}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {(a.name || "").slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{a.name}</div>
                    {a.subtitle && (
                      <div className="text-xs text-muted-foreground">
                        {a.subtitle}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setShowAddCategory(true)}>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <div className="text-sm">Add account</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleSignOut}>
            <div className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              <div className="text-sm">Sign out…</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddCategoryModal
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
      />
    </>
  );
}
