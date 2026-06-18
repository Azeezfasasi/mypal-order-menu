// components/availability/TimeInput.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { JSX, useState, useEffect } from "react";

interface TimeInputProps {
  value: string; // Format: "HH:mm"
  onChange: (time: string) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Custom time input component that displays hours and minutes in separate boxes
 * for better mobile UX. Shows time like "09 : 00" instead of native time picker.
 * Includes increment/decrement buttons for easier time selection.
 */
export function TimeInput({
  value,
  onChange,
  disabled = false,
  id,
}: TimeInputProps): JSX.Element {
  // Parse the time string (HH:mm format)
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");

  // Update local state when value prop changes
  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setHours(h || "00");
      setMinutes(m || "00");
    }
  }, [value]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHours = e.target.value.replace(/\D/g, ""); // Only allow digits
    
    // If more than 2 digits, truncate
    if (newHours.length > 2) {
      newHours = newHours.slice(0, 2);
    }

    setHours(newHours);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newMinutes = e.target.value.replace(/\D/g, ""); // Only allow digits
    
    // If more than 2 digits, truncate
    if (newMinutes.length > 2) {
      newMinutes = newMinutes.slice(0, 2);
    }

    setMinutes(newMinutes);
  };

  const handleHoursBlur = () => {
    let validatedHours = hours;

    // If empty, default to 00
    if (validatedHours === "") {
      validatedHours = "00";
      setHours("00");
    } else {
      // Validate range (0-23)
      const hourValue = parseInt(validatedHours, 10);
      if (hourValue > 23) {
        validatedHours = "23";
        setHours("23");
      }
    }

    // Pad and notify parent
    onChange(`${validatedHours.padStart(2, "0")}:${minutes.padStart(2, "0")}`);
  };

  const handleMinutesBlur = () => {
    let validatedMinutes = minutes;

    // If empty, default to 00
    if (validatedMinutes === "") {
      validatedMinutes = "00";
      setMinutes("00");
    } else {
      // Validate range (0-59)
      const minuteValue = parseInt(validatedMinutes, 10);
      if (minuteValue > 59) {
        validatedMinutes = "59";
        setMinutes("59");
      }
    }

    // Pad and notify parent
    onChange(`${hours.padStart(2, "0")}:${validatedMinutes.padStart(2, "0")}`);
  };

  // Increment/Decrement handlers for hours
  const incrementHours = () => {
    if (disabled) return;
    let hourValue = parseInt(hours, 10) || 0;
    hourValue = (hourValue + 1) % 24; // Wrap around at 24
    const newHours = hourValue.toString().padStart(2, "0");
    setHours(newHours);
    onChange(`${newHours}:${minutes.padStart(2, "0")}`);
  };

  const decrementHours = () => {
    if (disabled) return;
    let hourValue = parseInt(hours, 10) || 0;
    hourValue = (hourValue - 1 + 24) % 24; // Wrap around, handle negative
    const newHours = hourValue.toString().padStart(2, "0");
    setHours(newHours);
    onChange(`${newHours}:${minutes.padStart(2, "0")}`);
  };

  // Increment/Decrement handlers for minutes
  const incrementMinutes = () => {
    if (disabled) return;
    let minuteValue = parseInt(minutes, 10) || 0;
    minuteValue = (minuteValue + 1) % 60; // Wrap around at 60
    const newMinutes = minuteValue.toString().padStart(2, "0");
    setMinutes(newMinutes);
    onChange(`${hours.padStart(2, "0")}:${newMinutes}`);
  };

  const decrementMinutes = () => {
    if (disabled) return;
    let minuteValue = parseInt(minutes, 10) || 0;
    minuteValue = (minuteValue - 1 + 60) % 60; // Wrap around, handle negative
    const newMinutes = minuteValue.toString().padStart(2, "0");
    setMinutes(newMinutes);
    onChange(`${hours.padStart(2, "0")}:${newMinutes}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hours Input with Arrows */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={incrementHours}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Input
          id={id ? `${id}-hours` : undefined}
          type="text"
          inputMode="numeric"
          value={hours}
          onChange={handleHoursChange}
          onBlur={handleHoursBlur}
          disabled={disabled}
          maxLength={2}
          className="w-16 h-10 text-center text-lg font-semibold"
          placeholder="00"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={decrementHours}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Separator */}
      <span className="text-2xl font-semibold text-muted-foreground">:</span>

      {/* Minutes Input with Arrows */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={incrementMinutes}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Input
          id={id ? `${id}-minutes` : undefined}
          type="text"
          inputMode="numeric"
          value={minutes}
          onChange={handleMinutesChange}
          onBlur={handleMinutesBlur}
          disabled={disabled}
          maxLength={2}
          className="w-16 h-10 text-center text-lg font-semibold"
          placeholder="00"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={decrementMinutes}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
