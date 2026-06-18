"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { PayoutApi, type Settlement, type BankAccount, type CreateBankAccountRequest } from "@/services/api/payout-api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronsUpDown,
  CreditCard,
  Download,
  Edit,
  Loader2,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ====== Validation Schemas ======
const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required"),
  bank_code: z.string().min(1, "Please select a bank from the list"),
  account_name: z.string().min(1, "Account name is required"),
  account_number: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .max(11, "Account number cannot exceed 11 digits")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
});

const settlementScheduleSchema = z.object({
  frequency: z.string().min(1, "Frequency is required"),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;
type SettlementScheduleFormData = z.infer<typeof settlementScheduleSchema>;

// ====== Linked Bank Account Tab ======
function LinkedBankAccountTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);

  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } =
    PayoutApi.useGetBankAccounts();
  const { data: banksData, isLoading: isLoadingBanks, error: banksError } =
    PayoutApi.useGetAllBanks();
  const { mutateAsync: createBankAccount, isPending: isCreatingAccount } =
    PayoutApi.useCreateBankAccount();
  const { mutateAsync: updateBankAccount, isPending: isUpdatingAccount } =
    PayoutApi.useUpdateBankAccount();
  const { mutateAsync: setPrimaryAccount, isPending: isSettingPrimary } =
    PayoutApi.useSetPrimaryBankAccount();

  const banks = useMemo(() => {
    const bankList = banksData?.data || [];
    console.log("Banks data:", banksData);
    console.log("Extracted banks:", bankList);
    console.log("Banks count:", bankList.length);
    return bankList;
  }, [banksData]);

  const accounts = useMemo(() => bankAccountsData?.data?.accounts || [], [bankAccountsData]);
  const primaryAccount = useMemo(
    () => accounts.find((acc) => acc.is_primary),
    [accounts]
  );

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: "",
      bank_code: "",
      account_name: "",
      account_number: "",
    },
  });

  async function onSubmit(values: BankAccountFormData) {
    try {
      // Clean up the form values by trimming whitespace
      const cleanedValues: CreateBankAccountRequest = {
        bank_name: values.bank_name.trim(),
        bank_code: (values.bank_code || "").trim(),
        account_name: values.account_name.trim(),
        account_number: values.account_number.trim(),
      };

      console.log("Submitting bank account with data:", cleanedValues);

      if (isEditingExisting && editingAccountId) {
        await updateBankAccount({ id: editingAccountId, data: cleanedValues });
        toast.success("Bank account updated successfully");
        setIsEditingExisting(false);
        setEditingAccountId(null);
      } else {
        await createBankAccount(cleanedValues);
        toast.success("Bank account added successfully");
        setIsEditing(false);
      }
      form.reset();
    } catch (error) {
      console.error("Failed to save bank account:", error);
    }
  }

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccountId(account.id);
    setIsEditingExisting(true);
    form.setValue("bank_name", account.bank_name);
    form.setValue("bank_code", account.bank_code || "");
    form.setValue("account_name", account.account_name);
    form.setValue("account_number", account.account_number);
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      await setPrimaryAccount(accountId);
      toast.success("Primary account updated");
    } catch (error) {
      console.error("Failed to set primary account:", error);
    }
  };

  return (
    <div className="space-y-6">
      {isLoadingBankAccounts ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
          <span>Loading bank accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
            <CreditCard className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            You have not added any Bank account yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Your Bank account details will show here when it&apos;s been added
          </p>
          <Dialog
            open={isEditing}
            onOpenChange={(open) => {
              setIsEditing(open);
              if (!open) {
                form.reset();
                setEditingAccountId(null);
                setIsEditingExisting(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add account details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Bank Name Combobox */}
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Bank Name</FormLabel>
                        {isLoadingBanks && (
                          <div className="text-xs text-gray-500 mb-2">Loading banks...</div>
                        )}
                        {banksError && (
                          <div className="text-xs text-red-500 mb-2">
                            Error loading banks: {String(banksError)}
                          </div>
                        )}
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || (isLoadingBanks ? "Loading banks..." : "Select a bank")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search bank..." />
                              <CommandList>
                                {isLoadingBanks ? (
                                  <div className="py-6 px-4 text-center text-sm text-gray-500">
                                    Loading banks...
                                  </div>
                                ) : banks.length === 0 ? (
                                  <CommandEmpty>No bank found.</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {banks.map((bank) => (
                                      <CommandItem
                                        key={bank.code}
                                        value={bank.name}
                                        onSelect={(currentValue) => {
                                          form.setValue("bank_name", currentValue);
                                          form.setValue("bank_code", bank.code);
                                          setOpenCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === bank.name
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {bank.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Number */}
                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account number"
                            {...field}
                            maxLength={11}
                            inputMode="numeric"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Name */}
                  <FormField
                    control={form.control}
                    name="account_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={isCreatingAccount}
                    >
                      {isCreatingAccount && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Account
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        // Active Account Display
        <div className="space-y-6">
          {primaryAccount && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <p className="text-base text-gray-900 mt-1">
                    {primaryAccount.bank_name}
                  </p>
                </div>

                items-  <div>
                  <label className="text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <p className="text-base text-gray-900 mt-1">
                    {primaryAccount.account_number}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={primaryAccount.is_primary}
                    readOnly
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-orange-600 font-medium">
                    {primaryAccount.account_name}
                  </span>
                </div>

                {/* --- change from hidden to flex when endpoint to edit payout is available */}
                <div className="hidden gap-3 pt-4">
                  <Dialog
                    open={isEditingExisting}
                    onOpenChange={(open) => {
                      setIsEditingExisting(open);
                      if (!open) {
                        form.reset();
                        setEditingAccountId(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => primaryAccount && handleEditAccount(primaryAccount)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Bank Account</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          {/* Bank Name */}
                          <FormField
                            control={form.control}
                            name="bank_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? banks.find((bank) => bank.name === field.value)?.name
                                          : "Select bank..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search bank..." />
                                      <CommandEmpty>No bank found.</CommandEmpty>
                                      <CommandGroup>
                                        <CommandList>
                                          {banks.map((bank) => (
                                            <CommandItem
                                              value={bank.name}
                                              key={bank.id}
                                              onSelect={(currentValue) => {
                                                form.setValue("bank_name", currentValue);
                                                form.setValue("bank_code", bank.code);
                                                form.setValue("account_name", "");
                                                setOpenCombobox(false);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === bank.name
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {bank.name}
                                            </CommandItem>
                                          ))}
                                        </CommandList>
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Account Number */}
                          <FormField
                            control={form.control}
                            name="account_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter account number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Account Name */}
                          <FormField
                            control={form.control}
                            name="account_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter account name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setIsEditingExisting(false);
                                setEditingAccountId(null);
                                form.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 bg-orange-600 hover:bg-orange-700"
                              disabled={isUpdatingAccount}
                            >
                              {isUpdatingAccount && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}

          {/* Other Accounts */}
          {accounts.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Other Accounts
              </h4>
              <div className="space-y-3">
                {accounts.map((account) => (
                  !account.is_primary && (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {account.bank_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {account.account_number}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(account.id)}
                        disabled={isSettingPrimary}
                        className="bg-orange-400 text-white hover:bg-orange-500 hover:text-white"
                      >
                        Set Primary
                      </Button>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Add Another Account Button */}
          <Dialog
            open={isEditing}
            onOpenChange={(open) => {
              setIsEditing(open);
              if (!open) {
                form.reset();
                setEditingAccountId(null);
                setIsEditingExisting(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Bank Name Combobox */}
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Bank Name</FormLabel>
                        {isLoadingBanks && (
                          <div className="text-xs text-gray-500 mb-2">Loading banks...</div>
                        )}
                        {banksError && (
                          <div className="text-xs text-red-500 mb-2">
                            Error loading banks: {String(banksError)}
                          </div>
                        )}
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || (isLoadingBanks ? "Loading banks..." : "Select a bank")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search bank..." />
                              <CommandList>
                                {isLoadingBanks ? (
                                  <div className="py-6 px-4 text-center text-sm text-gray-500">
                                    Loading banks...
                                  </div>
                                ) : banks.length === 0 ? (
                                  <CommandEmpty>No bank found.</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {banks.map((bank) => (
                                      <CommandItem
                                        key={bank.code}
                                        value={bank.name}
                                        onSelect={(currentValue) => {
                                          form.setValue("bank_name", currentValue);
                                          form.setValue("bank_code", bank.code);
                                          setOpenCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === bank.name
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {bank.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Number */}
                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter account number"
                            {...field}
                            maxLength={11}
                            inputMode="numeric"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Name */}
                  <FormField
                    control={form.control}
                    name="account_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={isCreatingAccount}
                    >
                      {isCreatingAccount && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Account
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

// ====== Settlement Schedule Tab ======
function SettlementScheduleTab() {
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [selectedTime, setSelectedTime] = useState({ hours: "11", minutes: "59", period: "PM" });

  const { data: configData, isLoading: isLoadingConfig } =
    PayoutApi.useGetPayoutConfig();
  const { data: estimatedData, isLoading: isLoadingEstimated } =
    PayoutApi.useGetEstimatedPayout();
  const { mutateAsync: updateConfig, isPending: isUpdatingConfig } =
    PayoutApi.useUpdatePayoutConfig();

  const form = useForm<SettlementScheduleFormData>({
    resolver: zodResolver(settlementScheduleSchema),
    defaultValues: {
      frequency: configData?.data?.frequency || "Daily",
    },
  });

  useEffect(() => {
    if (configData?.data) {
      form.setValue("frequency", configData.data.frequency);
    }
  }, [configData, form]);

  async function onSubmit(values: SettlementScheduleFormData) {
    try {
      await updateConfig(values);
      setIsEditingSchedule(false);
      toast.success("Settlement schedule updated");
    } catch (error) {
      console.error("Failed to update schedule:", error);
    }
  }

  const frequencies = ["Daily", "Weekly", "Monthly"];

  return (
    <div className="space-y-6">
      {isLoadingConfig || isLoadingEstimated ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
          <span>Loading schedule information...</span>
        </div>
      ) : (
        <>
          {/* Next Payout Section */}
          {estimatedData?.data && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex md:flex-col md:gap-6 items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-600 mb-4">
                    Settlement Schedule
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Current Frequency
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {configData?.data?.frequency || "Daily"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payout Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTime.hours}:{selectedTime.minutes} {selectedTime.period}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Estimated Amount:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₦{estimatedData.data.estimated_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingSchedule(true)}
                  className="flex items-center gap-2 bg-orange-400 text-white hover:bg-orange-500 hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                  Edit schedule
                </Button>
              </div>
            </div>
          )}

          {/* Edit Schedule Dialog */}
          <Dialog open={isEditingSchedule} onOpenChange={setIsEditingSchedule}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Settlement Schedule</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Frequency */}
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Frequency</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {frequencies.map((freq) => (
                              <SelectItem key={freq} value={freq}>
                                {freq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Picker */}
                  <div>
                    <FormLabel>Payout Time</FormLabel>
                    <div className="flex items-center gap-2 justify-center mt-4 py-4 bg-gray-50 rounded-lg">
                      <Input
                        type="text"
                        value={selectedTime.hours}
                        onChange={(e) =>
                          setSelectedTime({
                            ...selectedTime,
                            hours: e.target.value.slice(0, 2),
                          })
                        }
                        maxLength={2}
                        className="w-16 text-center text-2xl font-bold"
                      />
                      <span className="text-2xl font-bold">:</span>
                      <Input
                        type="text"
                        value={selectedTime.minutes}
                        onChange={(e) =>
                          setSelectedTime({
                            ...selectedTime,
                            minutes: e.target.value.slice(0, 2),
                          })
                        }
                        maxLength={2}
                        className="w-16 text-center text-2xl font-bold"
                      />
                      <Select
                        value={selectedTime.period}
                        onValueChange={(value) =>
                          setSelectedTime({ ...selectedTime, period: value })
                        }
                      >
                        <SelectTrigger className="w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsEditingSchedule(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={isUpdatingConfig}
                    >
                      {isUpdatingConfig && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// ====== Settlement History Tab ======
function SettlementHistoryTab() {
  const { data: settlementsData, isLoading: isLoadingSettlements } =
    PayoutApi.useGetSettlements();
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  const settlements = useMemo(() => {
    // Handle different response structures
    if (Array.isArray(settlementsData?.data)) {
      return settlementsData.data;
    }
    // Fallback if data is directly an array or if structure is different
    if (Array.isArray(settlementsData)) {
      return settlementsData;
    }
    return [];
  }, [settlementsData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "processing":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {isLoadingSettlements ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
          <span>Loading settlement history...</span>
        </div>
      ) : settlements.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
            <CreditCard className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            You&apos;ve not had any payout yet
          </h3>
          <p className="text-sm text-gray-500">
            Payout history will show here when you have some
          </p>
        </div>
      ) : (
        // Settlements Table
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Settlement ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Gross Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {settlements.map((settlement: Settlement) => (
                <tr key={settlement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {settlement.settlement_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(settlement.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">
                    ₦{settlement.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">
                    ₦{settlement.gross_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                        getStatusColor(settlement.status)
                      )}
                    >
                      {settlement.status.charAt(0).toUpperCase() +
                        settlement.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSettlement(settlement)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          View details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Settlement Details</DialogTitle>
                        </DialogHeader>
                        {selectedSettlement && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download CSV
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download PDF
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-600">
                                    Settlement ID
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {selectedSettlement.settlement_id}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-600">
                                    Date Created
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(
                                      selectedSettlement.date
                                    ).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-600">Total</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    ₦{selectedSettlement.total.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-600">
                                    Gross Amount
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    ₦
                                    {selectedSettlement.gross_amount.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-600">
                                    Payment status
                                  </p>
                                  <p
                                    className={cn(
                                      "text-sm font-medium",
                                      getStatusColor(selectedSettlement.status)
                                    )}
                                  >
                                    {selectedSettlement.status.charAt(0).toUpperCase() +
                                      selectedSettlement.status.slice(1)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={() => setSelectedSettlement(null)}
                              className="w-full"
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ====== Payout Status Tab ======
function PayoutStatusTab() {
  const { data: configData, isLoading: isLoadingConfig } =
    PayoutApi.useGetPayoutConfig();
  const { data: settlementsData, isLoading: isLoadingSettlements } =
    PayoutApi.useGetSettlements();

  const settlements = useMemo(() => {
    if (Array.isArray(settlementsData?.data)) {
      return settlementsData.data;
    }
    if (Array.isArray(settlementsData)) {
      return settlementsData;
    }
    return [];
  }, [settlementsData]);

  const lastPayout = useMemo(() => {
    if (settlements.length === 0) return null;
    // Sort by date descending to get most recent
    return [...settlements].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }, [settlements]);

  const nextPayoutDate = useMemo(() => {
    if (!lastPayout || !configData?.data?.frequency) return null;

    const lastDate = new Date(lastPayout.date);
    const frequency = configData.data.frequency.toLowerCase();

    // Calculate next payout based on frequency
    const nextDate = new Date(lastDate);
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return null;
    }

    return nextDate;
  }, [lastPayout, configData]);

  const isLoading = isLoadingConfig || isLoadingSettlements;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
          <span>Loading payout status...</span>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payout Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payout Enabled</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Payout Date</span>
              <span className="text-sm font-medium text-gray-900">
                {lastPayout ? (
                  new Date(lastPayout.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                ) : (
                  "No payouts yet"
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Next Scheduled Payout</span>
              <span className="text-sm font-medium text-gray-900">
                {nextPayoutDate ? (
                  nextPayoutDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                ) : (
                  "Not scheduled"
                )}
              </span>
            </div>
            {configData?.data?.frequency && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payout Frequency</span>
                <span className="text-sm font-medium text-gray-900">
                  {configData.data.frequency}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Main Settlement Tab Component ======
export function SettlementTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Settlement Accounts
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Manage your bank accounts, settlement schedules, and view payout history.
        </p>
      </div>

      <div className="flex flex-row md:flex-col gap-6 md:gap-4">
        {/* Vertical Tabs Navigation */}
        <Tabs defaultValue="linked-bank" className="w-full flex flex-row md:flex-col gap-6 md:gap-3">
          <TabsList className="flex flex-col md:flex-row w-48 md:w-full h-fit md:h-auto gap-0 md:gap-2 bg-gray-100 p-2 rounded-lg md:overflow-x-auto md:flex-wrap">
            <TabsTrigger
              value="linked-bank"
              className="justify-start md:justify-center w-full md:flex-1 flex-shrink-0 md:flex-shrink data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=inactive]:text-gray-700 rounded px-4 py-3 font-medium text-sm"
            >
              Linked Bank Account
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="justify-start md:justify-center w-full md:flex-1 flex-shrink-0 md:flex-shrink data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=inactive]:text-gray-700 rounded px-4 py-3 font-medium text-sm"
            >
              Settlement Schedule
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="justify-start md:justify-center w-full md:flex-1 flex-shrink-0 md:flex-shrink data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=inactive]:text-gray-700 rounded px-4 py-3 font-medium text-sm"
            >
              Settlement History
            </TabsTrigger>
            <TabsTrigger
              value="payout-status"
              className="justify-start md:justify-center w-full md:flex-1 flex-shrink-0 md:flex-shrink data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=inactive]:text-gray-700 rounded px-4 py-3 font-medium text-sm"
            >
              Payout Status
            </TabsTrigger>
          </TabsList>

          {/* Content Area */}
          <div className="flex-1 w-full">
            <TabsContent value="linked-bank" className="mt-0">
              <LinkedBankAccountTab />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <SettlementScheduleTab />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <SettlementHistoryTab />
            </TabsContent>

            <TabsContent value="payout-status" className="mt-0">
              <PayoutStatusTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
