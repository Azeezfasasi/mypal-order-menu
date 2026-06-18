/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react"; // Only need Plus and Loader2 here now
import { useCallback, useMemo, useState } from "react";
import { z, type ZodIssue } from "zod";
// Removed Input, Label, Popover, Calendar as they are now in sub-components or Calendar25
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { addDays, format, isValid, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";

// API Imports & Types
import {
  BusinessBlackoutApi,
  type IBlackoutDay,
} from "@/services/api/blackout-api";
import {
  BusinessOperatingDayApi,
  type IOperatingDay,
} from "@/services/api/operating-days-api";

import {
  createBlackoutDatesColumns,
  createOperatingHoursColumns,
  DayName,
  dayNames,
} from "@/components/service-availability-columns";

// Assuming these utils are correctly typed as per the previous artifact
import { convertTo12Hour, convertTo24Hour } from "@/lib/utils";

// Import the new reusable components
import { BlackoutDateForm } from "@/components/availability/BlackoutDateForm";
import { DialogFooterActions } from "@/components/availability/DialogFooterActions";
import { OperatingHoursForm } from "@/components/availability/OperatingHoursForm";
import AdvancedBuffetServiceAvailability from "@/components/offerings/buffet-offerings/advanced-service-availability";

const DAYS_OF_WEEK: { day: DayName }[] = dayNames.map((day) => ({ day }));
export type OperatingHoursRowData = (typeof DAYS_OF_WEEK)[number];

// Default times in 24-hour format for the input type="time"
const DEFAULT_OPENING_TIME_24HR = "09:00";
const DEFAULT_CLOSING_TIME_24HR = "17:00";

// Allowed days for the Add flow (Sunday - Saturday)
const OPERATING_ADD_ALLOWED_DAYS: DayName[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Validation Schemas
const time24hrRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/; // Regex for HH:mm (24-hour format)

const operatingHoursSchema = z
  .object({
    day: z.enum(dayNames, { required_error: "Day is required." }),
    opening_time: z.string().regex(time24hrRegex, {
      message: "Time must be in HH:mm format (e.g., 09:00)",
    }),
    closing_time: z.string().regex(time24hrRegex, {
      message: "Time must be in HH:mm format (e.g., 17:00)",
    }),
    is_24_hours: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Skip time validation if 24 hours
      if (data.is_24_hours) {
        return true;
      }

      const [openH, openM] = data.opening_time.split(":").map(Number);
      const [closeH, closeM] = data.closing_time.split(":").map(Number);

      const openTime = setMinutes(setHours(new Date(), openH), openM);
      let closeTime = setMinutes(setHours(new Date(), closeH), closeM);

      // If closing time is before or equal to opening time, assume it's the next day
      if (closeTime <= openTime) {
        closeTime = addDays(closeTime, 1);
      }

      return closeTime > openTime;
    },
    {
      message: "Closing time must be after opening time",
      path: ["closing_time"],
    },
  );

const blackoutDateSchema = z.object({
  date: z.date({
    required_error: "Date is required.",
    invalid_type_error: "Invalid date selected.",
  }),
  reason: z.string().max(255, "Reason must be 255 characters or less."),
});

type DialogMode = "operatingHours" | "blackoutDate" | null;

export default function ServiceAvailabilityPage() {
  // State for dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);

  // Operating hours form state
  const [selectedDay, setSelectedDay] = useState<DayName | "">("");
  const [openingTime, setOpeningTime] = useState<string>(
    DEFAULT_OPENING_TIME_24HR,
  );
  const [closingTime, setClosingTime] = useState<string>(
    DEFAULT_CLOSING_TIME_24HR,
  );
  const [is24Hours, setIs24Hours] = useState<boolean>(false);
  const [operatingHoursErrors, setOperatingHoursErrors] = useState<ZodIssue[]>(
    [],
  );

  // Blackout date form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blackoutReason, setBlackoutReason] = useState<string>("");
  const [blackoutDateErrors, setBlackoutDateErrors] = useState<ZodIssue[]>([]);

  // API Hooks
  const { data: operatingDaysResponse, isLoading: isLoadingOperatingDays } =
    BusinessOperatingDayApi.useGetBusinessOperatingDays();
  const { data: blackoutDaysResponse, isLoading: isLoadingBlackoutDays } =
    BusinessBlackoutApi.useGetBusinessBlackoutDays();

  // Mutations
  const createOperatingDayMutation =
    BusinessOperatingDayApi.useCreateOperatingDay();
  const updateOperatingDayMutation =
    BusinessOperatingDayApi.useUpdateOperatingDay();
  const deleteOperatingDayMutation =
    BusinessOperatingDayApi.useDeleteOperatingDay();
  const createBlackoutDayMutation = BusinessBlackoutApi.useCreateBlackoutDay();
  const updateBlackoutDayMutation = BusinessBlackoutApi.useUpdateBlackoutDay();
  const deleteBlackoutDayMutation = BusinessBlackoutApi.useDeleteBlackoutDay();

  // Derived state
  const operatingDays: IOperatingDay[] = useMemo(
    () => operatingDaysResponse?.data || [],
    [operatingDaysResponse],
  );

  const blackoutDays: IBlackoutDay[] = useMemo(
    () => blackoutDaysResponse?.data || [],
    [blackoutDaysResponse],
  );

  const operatingDaysMap = useMemo(() => {
    const map = new Map<string, IOperatingDay>();
    operatingDays.forEach((opDay) => map.set(opDay.day.toLowerCase(), opDay));
    return map;
  }, [operatingDays]);

  // Helper functions
  const findOperatingDay = useCallback(
    (dayKey: string): IOperatingDay | undefined =>
      operatingDaysMap.get(dayKey.toLowerCase()),
    [operatingDaysMap],
  );

  const formatBlackoutDateForDisplay = useCallback(
    (dateString: string): string => {
      if (!dateString || !dateString.includes("-")) return "Invalid Date";
      try {
        const [day, month] = dateString.split("-");
        const tempDate = new Date();
        tempDate.setMonth(parseInt(month, 10) - 1);
        tempDate.setDate(parseInt(day, 10));

        return isValid(tempDate) ? format(tempDate, "MMMM d") : "Invalid Date";
      } catch (e) {
        console.error("Error parsing blackout date:", e);
        return "Parsing Error";
      }
    },
    [],
  );

  const formatToApiDateFormat = useCallback(
    (dateObj: Date | undefined): string => {
      return dateObj && isValid(dateObj) ? format(dateObj, "dd-MM") : "";
    },
    [],
  );

  // Reset form helpers
  const resetOperatingHoursForm = useCallback(() => {
    setSelectedDay("");
    setOpeningTime(DEFAULT_OPENING_TIME_24HR);
    setClosingTime(DEFAULT_CLOSING_TIME_24HR);
    setIs24Hours(false);
    setOperatingHoursErrors([]);
  }, []);

  const resetBlackoutDateForm = useCallback(() => {
    setSelectedDate(undefined);
    setBlackoutReason("");
    setBlackoutDateErrors([]);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogMode(null);
    setCurrentEditingId(null);
    resetOperatingHoursForm();
    resetBlackoutDateForm();
  }, [resetOperatingHoursForm, resetBlackoutDateForm]);

  // Event Handlers for Operating Hours
  const handleOpenOperatingHoursDialog = useCallback(
    (day: DayName) => {
      resetOperatingHoursForm();
      const existingDay = findOperatingDay(day);

      setSelectedDay(day);
      setCurrentEditingId(existingDay?.id || null);

      if (existingDay) {
        const is24HoursValue = (existingDay as any).is_24_hours || false;
        setIs24Hours(is24HoursValue);

        if (is24HoursValue) {
          // If 24 hours, show default times (they won't be used)
          setOpeningTime(DEFAULT_OPENING_TIME_24HR);
          setClosingTime(DEFAULT_CLOSING_TIME_24HR);
        } else {
          // Convert stored 12-hour format to 24-hour for the time input type="time"
          setOpeningTime(
            convertTo24Hour(existingDay.opening_time) ||
              DEFAULT_OPENING_TIME_24HR,
          );
          setClosingTime(
            convertTo24Hour(existingDay.closing_time) ||
              DEFAULT_CLOSING_TIME_24HR,
          );
        }
      }
      setDialogMode("operatingHours");
      setDialogOpen(true);
    },
    [findOperatingDay, resetOperatingHoursForm],
  );

  const handleSaveOperatingHours = useCallback(async () => {
    setOperatingHoursErrors([]);

    // Validate using the schema that expects 24-hour format
    const validationResult = operatingHoursSchema.safeParse({
      day: selectedDay,
      opening_time: openingTime,
      closing_time: closingTime,
      is_24_hours: is24Hours,
    });

    if (!validationResult.success) {
      setOperatingHoursErrors(validationResult.error.issues);
      toast.error(
        validationResult.error.issues[0]?.message || "Please fix the errors.",
      );
      return;
    }

    try {
      // Convert validated 24-hour times to 12-hour for the API payload
      const payload: any = {
        day: validationResult.data.day,
        opening_time: validationResult.data.is_24_hours
          ? "12:00 AM"
          : convertTo12Hour(validationResult.data.opening_time),
        closing_time: validationResult.data.is_24_hours
          ? "12:00 AM"
          : convertTo12Hour(validationResult.data.closing_time),
        is_24_hours: validationResult.data.is_24_hours,
        closes_next_day: false,
      };

      if (currentEditingId) {
        await updateOperatingDayMutation.mutateAsync({
          id: currentEditingId,
          ...payload,
        });
        toast.success(`${payload.day} operating hours updated.`);
      } else {
        await createOperatingDayMutation.mutateAsync(payload);
        toast.success(`${payload.day} operating hours saved.`);
      }
      closeDialog();
    } catch (error: any) {
      console.error("Failed to save operating hours:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save operating hours";
      toast.error(errorMessage);
    }
  }, [
    selectedDay,
    openingTime,
    closingTime,
    is24Hours,
    currentEditingId,
    updateOperatingDayMutation,
    createOperatingDayMutation,
    closeDialog,
  ]);

  const handleDeleteOperatingHours = useCallback(async () => {
    if (!currentEditingId || !selectedDay) return;
    try {
      await deleteOperatingDayMutation.mutateAsync(currentEditingId);
      toast.success(`${selectedDay} marked as closed.`);
      closeDialog();
    } catch (error: any) {
      console.error("Failed to delete operating hours:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete operating hours";
      toast.error(errorMessage);
    }
  }, [currentEditingId, selectedDay, deleteOperatingDayMutation, closeDialog]);

  // Event handlers for Blackout Dates
  const handleOpenBlackoutDateDialog = useCallback(
    (blackoutDay?: IBlackoutDay | null) => {
      resetBlackoutDateForm();
      setCurrentEditingId(blackoutDay?.id || null);

      if (blackoutDay) {
        setBlackoutReason(blackoutDay.reason || "");
        try {
          // Parse "dd-MM" string into a Date object for the Calendar component
          const [dayStr, monthStr] = blackoutDay.date.split("-");
          const date = new Date(); // Use current year as default
          date.setDate(parseInt(dayStr, 10));
          date.setMonth(parseInt(monthStr, 10) - 1);
          setSelectedDate(isValid(date) ? date : undefined);
        } catch {
          setSelectedDate(undefined);
          toast.error("Could not parse the existing blackout date.");
        }
      }
      setDialogMode("blackoutDate");
      setDialogOpen(true);
    },
    [resetBlackoutDateForm],
  );

  const handleSaveBlackoutDate = useCallback(async () => {
    setBlackoutDateErrors([]);
    const formData = {
      date: selectedDate,
      reason: blackoutReason || undefined,
    };
    const validationResult = blackoutDateSchema.safeParse(formData);

    if (!validationResult.success) {
      setBlackoutDateErrors(validationResult.error.issues);
      toast.error(
        validationResult.error.issues[0]?.message || "Please fix the errors.",
      );
      return;
    }

    const validatedData = validationResult.data;
    const formattedDate = formatToApiDateFormat(validatedData.date);

    if (!formattedDate) {
      toast.error("Error formatting the date. Please select a valid date.");
      return;
    }

    const payload = {
      date: formattedDate, // API expects "dd-MM"
      reason: validatedData.reason || "",
    };

    try {
      if (currentEditingId) {
        await updateBlackoutDayMutation.mutateAsync({
          id: currentEditingId,
          ...payload,
        });
        toast.success(`Blackout date ${payload.date} updated.`);
      } else {
        await createBlackoutDayMutation.mutateAsync(payload);
        toast.success(`Blackout date ${payload.date} added.`);
      }
      closeDialog();
    } catch (error: any) {
      console.error("Failed to save blackout date:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save blackout date";
      toast.error(errorMessage);
    }
  }, [
    selectedDate,
    blackoutReason,
    currentEditingId,
    formatToApiDateFormat,
    updateBlackoutDayMutation,
    createBlackoutDayMutation,
    closeDialog,
  ]);

  const handleDeleteBlackoutDate = useCallback(
    async (id: string) => {
      try {
        await deleteBlackoutDayMutation.mutateAsync(id);
        toast.success("Blackout date deleted.");
        if (id === currentEditingId) {
          closeDialog();
        }
      } catch (error: any) {
        console.error("Failed to delete blackout date:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete blackout date";
        toast.error(errorMessage);
      }
    },
    [deleteBlackoutDayMutation, currentEditingId, closeDialog],
  );

  // Handler to delete an operating day from the table actions
  const handleDeleteOperatingDayRow = useCallback(
    async (id: string) => {
      try {
        await deleteOperatingDayMutation.mutateAsync(id);
        toast.success("Operating day deleted.");
      } catch (error: any) {
        console.error("Failed to delete operating day:", error);
        const errorMessage =
          error?.response?.data?.message || error?.message || "Delete failed";
        toast.error(errorMessage);
      }
    },
    [deleteOperatingDayMutation],
  );

  // Table column definitions
  const operatingHoursColumns = useMemo(
    (): ColumnDef<OperatingHoursRowData>[] =>
      createOperatingHoursColumns(
        findOperatingDay,
        handleOpenOperatingHoursDialog,
        handleDeleteOperatingDayRow,
        deleteOperatingDayMutation,
      ),
    [
      findOperatingDay,
      handleOpenOperatingHoursDialog,
      handleDeleteOperatingDayRow,
      deleteOperatingDayMutation,
    ],
  );

  const blackoutDatesColumns = useMemo(
    (): ColumnDef<IBlackoutDay>[] =>
      createBlackoutDatesColumns(
        formatBlackoutDateForDisplay,
        handleOpenBlackoutDateDialog,
        handleDeleteBlackoutDate,
        deleteBlackoutDayMutation,
      ),
    [
      formatBlackoutDateForDisplay,
      handleOpenBlackoutDateDialog,
      handleDeleteBlackoutDate,
      deleteBlackoutDayMutation,
    ],
  );

  // Table instances
  const operatingTable = useReactTable({
    data: DAYS_OF_WEEK,
    columns: operatingHoursColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const blackoutTable = useReactTable({
    data: blackoutDays,
    columns: blackoutDatesColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Render JSX
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="lg:text-2xl text-3xl font-bold">Service Availability</h1>
        <p className="text-muted-foreground mt-1">
          Manage your business operating hours and blackout dates.
        </p>
      </div>

      <Card>
        <CardHeader className="flex items-center flex-row justify-between">
          <CardTitle className="font-semibold text-primary-600">
            Operating Hours
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // open dialog for creating a new operating day
              resetOperatingHoursForm();
              setCurrentEditingId(null);
              // compute first unassigned day from allowed list
              const firstUnassigned = OPERATING_ADD_ALLOWED_DAYS.find(
                (d) => !operatingDaysMap.has(d.toLowerCase()),
              );
              const preselect =
                firstUnassigned || OPERATING_ADD_ALLOWED_DAYS[0];
              setSelectedDay(preselect);
              setDialogMode("operatingHours");
              setDialogOpen(true);
            }}
            disabled={isLoadingOperatingDays}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Day
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingOperatingDays ? (
            <div className="flex justify-center items-center py-8 min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {operatingTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="text-[#0B5B8C] font-sora"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {operatingTable.getRowModel().rows.length ? (
                    operatingTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={
                          row.getIsSelected() ? "selected" : undefined
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={operatingHoursColumns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No operating hours data found. Click on a day to set
                        hours.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-semibold text-primary-600">
            Blackout Dates
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenBlackoutDateDialog(null)}
            disabled={isLoadingBlackoutDays}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Date
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingBlackoutDays ? (
            <div className="flex justify-center items-center py-8 min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  {blackoutTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="text-[#0B5B8C] font-sora"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {blackoutTable.getRowModel().rows.length ? (
                    blackoutTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={
                          row.getIsSelected() ? "selected" : undefined
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={blackoutDatesColumns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No blackout dates added.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Availability Section - Only for Buffet Service Type */}
      <AdvancedBuffetServiceAvailability />

      {/* Unified Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "operatingHours"
                ? currentEditingId && selectedDay
                  ? `Edit Hours for ${selectedDay}`
                  : "Set Operating Hours"
                : currentEditingId
                  ? "Edit Blackout Date"
                  : "Add Blackout Date"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "operatingHours"
                ? "Set the daily operating hours for your business."
                : "Add or edit dates when your business will be closed."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {dialogMode === "operatingHours" && (
              <OperatingHoursForm
                selectedDay={selectedDay}
                setSelectedDay={(d) => setSelectedDay(d)}
                openingTime={openingTime}
                setOpeningTime={setOpeningTime}
                closingTime={closingTime}
                setClosingTime={setClosingTime}
                is24Hours={is24Hours}
                setIs24Hours={setIs24Hours}
                errors={operatingHoursErrors}
                allowedDays={OPERATING_ADD_ALLOWED_DAYS}
                isEditing={!!currentEditingId}
              />
            )}

            {dialogMode === "blackoutDate" && (
              <BlackoutDateForm
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                blackoutReason={blackoutReason}
                setBlackoutReason={setBlackoutReason}
                errors={blackoutDateErrors}
              />
            )}
          </div>

          <DialogFooter>
            <DialogFooterActions
              isEditing={!!currentEditingId}
              mode={dialogMode as "operatingHours" | "blackoutDate"} // Cast as it's guaranteed to be one of these when dialog is open
              onDelete={() =>
                dialogMode === "operatingHours"
                  ? handleDeleteOperatingHours()
                  : currentEditingId
                    ? handleDeleteBlackoutDate(currentEditingId)
                    : null
              }
              onCancel={closeDialog}
              onSave={() =>
                dialogMode === "operatingHours"
                  ? handleSaveOperatingHours()
                  : handleSaveBlackoutDate()
              }
              deletePending={
                deleteOperatingDayMutation.isPending ||
                deleteBlackoutDayMutation.isPending
              }
              savePending={
                createOperatingDayMutation.isPending ||
                updateOperatingDayMutation.isPending ||
                createBlackoutDayMutation.isPending ||
                updateBlackoutDayMutation.isPending
              }
              saveDisabled={
                (dialogMode === "operatingHours" && !selectedDay) ||
                (dialogMode === "blackoutDate" &&
                  !selectedDate &&
                  !!blackoutReason)
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
