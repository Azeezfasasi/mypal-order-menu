"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useKybStore } from "@/stores/kyb-store";
import {
  RequiredFieldsBanner,
  RequiredFieldBadge,
  isFieldRequired,
} from "@/components/kyb/required-fields-indicator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, CreditCard } from "lucide-react"; // Added Check and ChevronsUpDown
import { useEffect, useState } from "react"; // Import useEffect and useState
import { useForm } from "react-hook-form";
import { z } from "zod";
// Removed CustomInputField as we'll use shadcn components directly for combobox
// import { CustomInputField } from "../custom-input-field";
import { DefaultsApi } from "@/services/api/defaults-api";

// Import shadcn/ui components for combobox
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Assuming you have a utils file with a cn helper

// Update the form schema to make bank info optional
const formSchema = z.object({
  business_bank_name: z.string().optional(), // Made optional
  bank_code: z.string().optional(), // Made optional
  business_acc_name: z.string().optional(), // Made optional
  business_acc_number: z.string().optional(), // Made optional
});

interface KybBankingDetailsStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isSubmitting?: boolean;
}

export default function KybBankingDetailsStep({
  onNext,
  onPrevious,
  isSubmitting,
}: KybBankingDetailsStepProps) {
  const { bankingDetails, updateBankingDetails, requiredUpdates } =
    useKybStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_bank_name: bankingDetails.business_bank_name || "",
      bank_code: bankingDetails.bank_code || "",
      business_acc_name: bankingDetails.business_acc_name || "",
      business_acc_number: bankingDetails.business_acc_number || "",
    },
  });

  const {
    data: banks,
    isLoading: isLoadingBanks,
    // isError: isErrorBanks,
    // error: errorBanks,
  } = DefaultsApi.useGetAllBanks();

  // State to manage the open state of the combobox popover
  const [openCombobox, setOpenCombobox] = useState(false);

  // Effect to set the bank code when the bank name is set programmatically
  useEffect(() => {
    if (form.getValues("business_bank_name") && banks) {
      const selectedBank = banks.find(
        (bank) => bank.name === form.getValues("business_bank_name"),
      );
      if (selectedBank) {
        form.setValue("bank_code", selectedBank.code);
      }
    }
  }, [form, banks]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Filter out empty optional fields if you don't want them in the store
    const filteredValues = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(values).filter(([_, value]) => value !== ""),
    );
    updateBankingDetails(filteredValues);
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company profile</h1>
        <p className="mt-2 text-lg font-medium text-primary">
          Banking Details(Optional)
        </p>
        <p className="mt-1 text-gray-600">
          Please provide your business banking information for settlements
        </p>
      </div>

      {/* Required Fields Banner */}
      {requiredUpdates && requiredUpdates.length > 0 && (
        <RequiredFieldsBanner requiredFields={requiredUpdates} showBanner />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Bank Name Combobox */}
            <FormField
              control={form.control}
              name="business_bank_name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Bank name
                    {isFieldRequired("business_bank_name", requiredUpdates) && (
                      <RequiredFieldBadge />
                    )}
                  </FormLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                            isFieldRequired("business_bank_name", requiredUpdates)
                              ? "ring-2 ring-orange-300 border-orange-300"
                              : undefined,
                          )}
                          disabled={isLoadingBanks}
                        >
                          {field.value
                            ? banks?.find((bank) => bank.name === field.value)
                                ?.name
                            : isLoadingBanks
                              ? "Loading banks..."
                              : "Select bank"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search bank..." />
                        <CommandList>
                          <CommandEmpty>No bank found.</CommandEmpty>
                          <CommandGroup>
                            {(banks || []).map((bank) => (
                              <CommandItem
                                key={bank.code} // Use bank code as key
                                value={bank.name} // Use bank name for searching/display
                                onSelect={(currentValue) => {
                                  // Find the selected bank object
                                  const selectedBank = banks?.find(
                                    (b) =>
                                      b.name.toLowerCase() ===
                                      currentValue.toLowerCase(),
                                  );
                                  if (selectedBank) {
                                    form.setValue(
                                      "business_bank_name",
                                      selectedBank.name,
                                    );
                                    form.setValue(
                                      "bank_code",
                                      selectedBank.code,
                                    );
                                  } else {
                                    // Handle case where selection is cleared or not found
                                    form.setValue("business_bank_name", "");
                                    form.setValue("bank_code", "");
                                  }
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === bank.name
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {bank.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden field to store the bank code - still needed to store the code */}
            <FormField
              control={form.control}
              name="bank_code"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Bank Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Name Field - Now optional */}
            <FormField
              control={form.control}
              name="business_acc_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account name
                    {isFieldRequired("business_acc_name", requiredUpdates) && (
                      <RequiredFieldBadge />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter account name"
                      {...field}
                      className={cn(
                        isFieldRequired("business_acc_name", requiredUpdates)
                          ? "ring-2 ring-orange-300 border-orange-300"
                          : undefined,
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Number Field - Now optional */}
            <FormField
              control={form.control}
              name="business_acc_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account number
                    {isFieldRequired("business_acc_number", requiredUpdates) && (
                      <RequiredFieldBadge />
                    )}
                  </FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2",
                        isFieldRequired("business_acc_number", requiredUpdates)
                          ? "ring-2 ring-orange-300 border-orange-300"
                          : undefined,
                      )}
                    >
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <Input
                        placeholder="Enter account number"
                        {...field}
                        className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        type="number"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex-1"
              disabled={isSubmitting || isLoadingBanks}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting || isLoadingBanks}
            >
              Proceed
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
