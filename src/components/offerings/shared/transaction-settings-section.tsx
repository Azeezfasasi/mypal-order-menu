import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TransactionInformationApi } from "@/services/api/business-transaction-info-api";
import { TransactionInformationType } from "@/types/transaction-info-types";
import { Loader2, Lock, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Standard rates for transaction charges
const STANDARD_RATES: Record<TransactionInformationType, number> = {
  [TransactionInformationType.VAT]: 7.5,
  [TransactionInformationType.SERVICE_CHARGE]: 5,
  [TransactionInformationType.STATE_TAX]: 5, // Lagos State standard
  [TransactionInformationType.DISCOUNT]: 0,
};

const formatChargeType = (type: TransactionInformationType) => {
  switch (type) {
    case TransactionInformationType.VAT:
      return "V.A.T";
    case TransactionInformationType.SERVICE_CHARGE:
      return "Service Charge";
    case TransactionInformationType.DISCOUNT:
      return "Discount allocated";
    case TransactionInformationType.STATE_TAX:
      return "State Tax";
    default:
      return type;
  }
};

const getPricingExplanation = (
  chargeType: TransactionInformationType,
  percentage: number,
  isInclusive: boolean,
  basePrice: number = 5000
): string => {
  const chargeAmount = (basePrice * percentage) / 100;
  const totalPrice = basePrice + chargeAmount;

  switch (chargeType) {
    case TransactionInformationType.VAT:
      return isInclusive
        ? `E.g. Customer pays ₦${basePrice.toLocaleString()} (${percentage}% VAT included ≈ ₦${chargeAmount.toLocaleString()})`
        : `E.g. Customer pays ₦${basePrice.toLocaleString()} + ₦${chargeAmount.toLocaleString()} VAT = ₦${totalPrice.toLocaleString()}`;
    case TransactionInformationType.STATE_TAX:
      return isInclusive
        ? `E.g. Customer pays ₦${basePrice.toLocaleString()} (${percentage}% State Tax included ≈ ₦${chargeAmount.toLocaleString()})`
        : `E.g. Customer pays ₦${basePrice.toLocaleString()} + ₦${chargeAmount.toLocaleString()} Tax = ₦${totalPrice.toLocaleString()}`;
    case TransactionInformationType.SERVICE_CHARGE:
      return isInclusive
        ? `E.g. Customer pays ₦${basePrice.toLocaleString()} (${percentage}% Service Charge included ≈ ₦${chargeAmount.toLocaleString()})`
        : `E.g. Customer pays ₦${basePrice.toLocaleString()} + ₦${chargeAmount.toLocaleString()} Service Charge = ₦${totalPrice.toLocaleString()}`;
    default:
      return "";
  }
};

export default function BusinessTransactionInformation() {
  const {
    data: chargesData,
    isLoading,
    error,
  } = TransactionInformationApi.useGetBusinessCharges();

  const { mutateAsync: toggleChargeStatusAsync, isPending: isTogglingCharge } =
    TransactionInformationApi.useToggleBusinessChargeStatus();

  const {
    mutateAsync: updateChargePercentageAsync,
    isPending: isUpdatingChargePercentage,
  } = TransactionInformationApi.useUpdateBusinessChargePercentage();

  const [editCharge, setEditCharge] = useState<null | {
    id: string;
    type: TransactionInformationType;
    percentage: number;
    isInclusive?: boolean;
  }>(null);
  const [chargePercentage, setChargePercentage] = useState(0);
  const [isInclusive, setIsInclusive] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const handleToggle = async (
    type: TransactionInformationType,
    chargeId: string,
  ) => {
    if (isTogglingCharge) return;
    try {
      await toggleChargeStatusAsync({ type, chargeId });
      toast.success(`${formatChargeType(type)} status updated successfully!`);
    } catch (err) {
      const error = err as { response?: { status: number; data?: { message?: string } } } | Error;
      const isUnauthorizedError =
        "response" in error && error.response?.status === 403;
      
      if (isUnauthorizedError) {
        setIsUnauthorized(true);
        toast.error("Your business type is not authorized to modify transaction charges.");
      } else {
        toast.error(
          `Failed to update ${formatChargeType(type)} status.`
        );
      }
    }
  };

  const openEditChargeDialog = (charge: {
    id: string;
    type: TransactionInformationType;
    percentage: number;
    isInclusive?: boolean;
  }) => {
    setEditCharge(charge);
    setChargePercentage(charge.percentage);
    setIsInclusive(charge.isInclusive ?? true);
  };

  const handleUpdateChargePercentage = async () => {
    if (!editCharge) return;
    try {
      await updateChargePercentageAsync({
        type: editCharge.type,
        percentage: chargePercentage,
        isInclusive: isInclusive,
      });
      toast.success(`${formatChargeType(editCharge.type)} updated successfully!`);
      setEditCharge(null);
    } catch (err) {
      const error = err as { response?: { status: number; data?: { message?: string } } } | Error;
      const isUnauthorizedError =
        "response" in error && error.response?.status === 403;
      
      if (isUnauthorizedError) {
        setIsUnauthorized(true);
        toast.error("Your business type is not authorized to modify transaction charges.");
      } else {
        toast.error(`Failed to update ${formatChargeType(editCharge.type)}.`);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="flex justify-center items-center p-8">
        <Loader message="Loading transaction info..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <ErrorHandler message={error.message} />
      </Card>
    );
  }

  if (isUnauthorized) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl text-orange-600 font-sora">
            Transaction information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <Lock className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">
                Feature not available for your business type
              </h3>
              <p className="text-sm text-amber-800">
                Transaction charge management is only available for: Buffet services, Club, Beaches &amp; Resorts, Boat and Yacht cruises, Fine Dining, Salons and spa, Short-let homes, and Parks &amp; Recreation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const charges = chargesData?.data || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl text-orange-600 font-sora">
          Transaction information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {charges.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No transaction charges available.
          </div>
        ) : (
          charges
            .filter((charge) => charge.type !== TransactionInformationType.DISCOUNT)
            .map((charge) => (
            <div
              key={charge.id}
              className="space-y-3 py-4 px-3 bg-orange-50 rounded-md border border-orange-100"
            >
              {/* Header Row */}
              <div className="flex md:flex-col md:gap-2 items-center justify-between">
                <span className="font-medium capitalize">
                  {formatChargeType(charge.type)}
                </span>
                <div className="flex items-center gap-3">
                  {/* Edit Button - Available for VAT, SERVICE_CHARGE, STATE_TAX */}
                  {(charge.type === TransactionInformationType.SERVICE_CHARGE ||
                    charge.type === TransactionInformationType.VAT ||
                    charge.type === TransactionInformationType.STATE_TAX) && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mr-2 bg-gray-300 rounded-full font-medium hover:bg-gray-400"
                        onClick={() => openEditChargeDialog(charge)}
                      >
                        Edit
                      </Button>
                      <Dialog
                        open={!!editCharge && editCharge.id === charge.id}
                        onOpenChange={(open) => !open && setEditCharge(null)}
                      >
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              Update {formatChargeType(charge.type)} Percentage
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            {/* Percentage Input */}
                            <div className="flex items-center gap-4">
                              <label
                                htmlFor="charge-percentage"
                                className="text-right font-medium min-w-fit"
                              >
                                Percentage:
                              </label>
                              <Input
                                id="charge-percentage"
                                type="number"
                                min="0"
                                max="100"
                                className="col-span-3"
                                value={chargePercentage}
                                onChange={(e) =>
                                  setChargePercentage(Number(e.target.value))
                                }
                              />
                            </div>

                            {/* Pricing Mode Toggle (for VAT, STATE_TAX, and SERVICE_CHARGE) */}
                            {(editCharge?.type === TransactionInformationType.VAT ||
                              editCharge?.type === TransactionInformationType.STATE_TAX ||
                              editCharge?.type === TransactionInformationType.SERVICE_CHARGE) && (
                              <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                                <label
                                  htmlFor="pricing-mode"
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {isInclusive
                                    ? "Included in price"
                                    : "Added to price"}
                                </label>
                                <Switch
                                  id="pricing-mode"
                                  checked={isInclusive}
                                  onCheckedChange={setIsInclusive}
                                />
                              </div>
                            )}

                            {/* Pricing Explanation */}
                            <div className="flex gap-2 p-3 bg-amber-50 rounded border border-amber-200">
                              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800">
                                {getPricingExplanation(
                                  editCharge?.type || charge.type,
                                  chargePercentage,
                                  isInclusive
                                )}
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleUpdateChargePercentage}
                              disabled={isUpdatingChargePercentage}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              {isUpdatingChargePercentage ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                    {charge.percentage}% {formatChargeType(charge.type)}
                  </Badge>

                  <Switch
                    checked={charge.isActive}
                    onCheckedChange={() => handleToggle(charge.type, charge.id)}
                    disabled={isTogglingCharge}
                  />
                </div>
              </div>

              {/* Standard Rate Reference */}
              <div className="w-fit flex gap-2 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-100">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  Standard rate: <span className="font-semibold">{STANDARD_RATES[charge.type as keyof typeof STANDARD_RATES]}%</span> {charge.percentage !== STANDARD_RATES[charge.type as keyof typeof STANDARD_RATES]}
                </p>
              </div>

              {/* Pricing Explanation Display */}
              {/* {charge.isActive && (
                <div className="w-fit flex gap-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <p>
                    {getPricingExplanation(
                      charge.type,
                      charge.percentage,
                      charge.isInclusive ?? true
                    )}
                  </p>
                </div>
              )} */}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
