import type { OrderItemAddon } from "@/lib/order-addons";

/** Add-ons the customer picked for an order item, e.g. "+ Extra cheese ×2 ₦1,000". */
export function OrderItemAddonList({
  addons,
  className = "",
}: {
  addons?: OrderItemAddon[];
  className?: string;
}) {
  if (!addons?.length) {
    return <p className={`text-xs italic text-slate-400 ${className}`}>No add-ons</p>;
  }
  return (
    <ul className={`space-y-0.5 ${className}`} aria-label="Add-ons">
      {addons.map((addon) => (
        <li key={addon.id} className="flex items-baseline justify-between gap-3 text-xs">
          <span className="min-w-0 text-slate-700">
            <span className="text-slate-400">+ </span>
            {addon.name}
            {addon.quantity > 1 && <span className="text-slate-500"> ×{addon.quantity}</span>}
            {addon.groupName && <span className="text-slate-400"> · {addon.groupName}</span>}
          </span>
          {addon.total > 0 && (
            <span className="shrink-0 font-medium text-slate-600">₦{addon.total.toLocaleString()}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
