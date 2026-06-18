"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "./button";

interface TimePickerAmPmProps {
  value: string; // Format: "HH:MM AM/PM" or "HH:MM" (24-hour)
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TimePickerAmPm = ({
  value,
  onChange,
  placeholder = "Select time",
}: TimePickerAmPmProps) => {
  const [hour, setHour] = useState("01");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [isOpen, setIsOpen] = useState(false);

  // Parse input value and update state
  useEffect(() => {
    if (value) {
      // Handle 12-hour format (e.g., "01:30 PM")
      if (value.includes("AM") || value.includes("PM")) {
        const [time, per] = value.split(" ");
        const [h, m] = time.split(":");
        setHour(h.padStart(2, "0"));
        setMinute(m.padStart(2, "0"));
        setPeriod(per as "AM" | "PM");
      }
      // Handle 24-hour format (e.g., "13:30")
      else if (value.includes(":")) {
        const [h, m] = value.split(":");
        const hourNum = parseInt(h, 10);
        const period = hourNum >= 12 ? "PM" : "AM";
        let hour12 = hourNum % 12;
        if (hour12 === 0) hour12 = 12;
        setHour(hour12.toString().padStart(2, "0"));
        setMinute(m.padStart(2, "0"));
        setPeriod(period);
      }
    }
  }, [value]);

  const handleHourChange = (newHour: number) => {
    const validHour = Math.max(1, Math.min(12, newHour));
    const paddedHour = validHour.toString().padStart(2, "0");
    setHour(paddedHour);
    updateValue(paddedHour, minute, period);
  };

  const handleMinuteChange = (newMinute: number) => {
    const validMinute = Math.max(0, Math.min(59, newMinute));
    const paddedMinute = validMinute.toString().padStart(2, "0");
    setMinute(paddedMinute);
    updateValue(hour, paddedMinute, period);
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === "AM" ? "PM" : "AM";
    setPeriod(newPeriod);
    updateValue(hour, minute, newPeriod);
  };

  const updateValue = (h: string, m: string, p: "AM" | "PM") => {
    const timeString = `${h}:${m} ${p}`;
    onChange(timeString);
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium">
          {value ? `${hour} : ${minute} ${period}` : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-48">
          <div className="flex items-center justify-between gap-4">
            {/* Hour Picker */}
            <div className="flex flex-col items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => handleHourChange(parseInt(hour, 10) + 1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <input
                type="number"
                min="1"
                max="12"
                value={hour}
                onChange={(e) => {
                  const val = e.target.value.padStart(2, "0");
                  setHour(val);
                }}
                onBlur={() => {
                  updateValue(hour, minute, period);
                }}
                className="w-12 text-center text-lg font-bold border border-gray-200 rounded py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => handleHourChange(parseInt(hour, 10) - 1)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Colon Separator */}
            <div className="text-xl font-bold">:</div>

            {/* Minute Picker */}
            <div className="flex flex-col items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => handleMinuteChange(parseInt(minute, 10) + 1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <input
                type="number"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => {
                  const val = e.target.value.padStart(2, "0");
                  setMinute(val);
                }}
                onBlur={() => {
                  updateValue(hour, minute, period);
                }}
                className="w-12 text-center text-lg font-bold border border-gray-200 rounded py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => handleMinuteChange(parseInt(minute, 10) - 1)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* AM/PM Toggle */}
            <Button
              type="button"
              onClick={handlePeriodToggle}
              className={`px-3 py-1 rounded font-bold text-white transition-colors ${
                period === "AM"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {period}
            </Button>
          </div>

          {/* Close Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
};
