/** An add-on the customer picked for an order item (e.g. "Extra cheese"). */
export interface OrderItemAddon {
  id: string;
  name: string;
  groupName?: string;
  quantity: number;
  /** Price of one unit of the add-on */
  unitPrice: number;
  /** unitPrice × quantity (or the API's own subtotal) */
  total: number;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;

const firstNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    const n = typeof value === "string" ? parseFloat(value) : Number(value);
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(n)) return n;
  }
  return undefined;
};

/**
 * Order items carry the add-ons the customer picked on mobile (from the
 * cart's selected_addons). The saved shape isn't documented, so accept a flat
 * { name, price, quantity } or an option nested under option/addon_option,
 * with the group under group/addon_group.
 */
export function normalizeOrderItemAddons(raw: unknown): OrderItemAddon[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index): OrderItemAddon | null => {
      const addon = asRecord(entry);
      if (!addon) return null;
      const option = asRecord(addon.option ?? addon.addon_option ?? addon.addonOption ?? addon.menu_addon_option);
      const group = asRecord(addon.group ?? addon.addon_group ?? addon.addonGroup ?? option?.group);
      const name = addon.name ?? addon.option_name ?? addon.addon_name ?? option?.name;
      if (typeof name !== "string" || !name.trim()) return null;
      const quantity = firstNumber(addon.quantity, addon.qty) ?? 1;
      const unitPrice = firstNumber(addon.price, addon.unit_price, addon.option_price, option?.price) ?? 0;
      return {
        id: String(addon.id ?? addon.option_id ?? option?.id ?? `addon-${index}`),
        name: name.trim(),
        groupName: (addon.group_name ?? group?.name) as string | undefined,
        quantity,
        unitPrice,
        total: firstNumber(addon.subtotal, addon.total, addon.amount) ?? unitPrice * quantity,
      };
    })
    .filter((addon): addon is OrderItemAddon => addon !== null);
}
