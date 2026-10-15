/**
 * Items subtotal, delivery and whatever else makes up the order total.
 * The API doesn't itemise service charges/taxes, so the remainder is shown as
 * "Fees & taxes" (or "Discount" when negative, e.g. a voucher).
 */
export function OrderPriceBreakdown({
  itemsSubtotal,
  deliveryFee,
  total,
  className = "",
}: {
  itemsSubtotal: number;
  deliveryFee: number;
  total: number;
  className?: string;
}) {
  const otherCharges = Math.round((total - itemsSubtotal - deliveryFee) * 100) / 100;
  const naira = (value: number) => `₦${value.toLocaleString()}`;

  return (
    <dl className={`mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm ${className}`}>
      <div className="flex items-center justify-between">
        <dt className="text-slate-500">Items subtotal</dt>
        <dd className="text-slate-900">{naira(itemsSubtotal)}</dd>
      </div>
      {deliveryFee > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Delivery</dt>
          <dd className="text-slate-900">{naira(deliveryFee)}</dd>
        </div>
      )}
      {otherCharges !== 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">{otherCharges > 0 ? "Fees & taxes" : "Discount"}</dt>
          <dd className={otherCharges > 0 ? "text-slate-900" : "text-green-700"}>
            {otherCharges > 0 ? "" : "−"}
            {naira(Math.abs(otherCharges))}
          </dd>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <dt className="font-medium text-slate-500">Total</dt>
        <dd className="font-bold text-slate-900">{naira(total)}</dd>
      </div>
    </dl>
  );
}
