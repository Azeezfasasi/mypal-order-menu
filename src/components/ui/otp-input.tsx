"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface OtpInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onKeyDown'> {
  value: string
  index: number
  onChange: (value: string, index: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void
  isFilled?: boolean
}

const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(
  ({ className, value, index, onChange, onKeyDown, onPaste, isFilled, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e.target.value, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPaste={index === 0 ? onPaste : undefined}
        className={cn(
          "h-12 w-12 text-center text-lg font-medium",
          isFilled && "border-primary text-primary",
          className,
        )}
        {...props}
      />
    )
  },
)

OtpInput.displayName = "OtpInput"

interface OtpInputGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  length?: number
  value: string[]
  onChange: (value: string[]) => void
}

const OtpInputGroup = React.forwardRef<HTMLDivElement, OtpInputGroupProps>(
  ({ className, length = 6, value, onChange, ...props }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    React.useEffect(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }, [])

    const handleChange = (digit: string, index: number) => {
      // Only allow numbers
      if (!/^\d*$/.test(digit)) return
      const newValue = [...value]
      newValue[index] = digit.substring(0, 1)
      onChange(newValue)
      // Auto-focus next input
      if (digit && index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      // Move to previous input on backspace
      if (e.key === "Backspace" && !value[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text/plain").trim()
      // Check if pasted content is a valid number with expected length
      if (new RegExp(`^\\d{${length}}$`).test(pastedData)) {
        const digits = pastedData.split("")
        onChange(digits)
        // Focus on the last input
        if (inputRefs.current[length - 1]) {
          inputRefs.current[length - 1]?.focus()
        }
      }
    }

    // Create a ref callback that properly sets the element in our refs array
    const setInputRef = React.useCallback((index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el;
    }, []);

    return (
      <div ref={ref} className={cn("flex items-center justify-center gap-2", className)} {...props}>
        {Array.from({ length }).map((_, index) => (
          <OtpInput
            key={index}
            ref={setInputRef(index)}
            value={value[index] || ""}
            index={index}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            isFilled={!!value[index]}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
    )
  },
)

OtpInputGroup.displayName = "OtpInputGroup"

export { OtpInput, OtpInputGroup }