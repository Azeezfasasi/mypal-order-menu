import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Function to handle tab key navigation
    const handleTabKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      // If shift + tab
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      }
      // If just tab
      else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    // Add event listener for tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        handleTabKey(e);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first focusable element
    const firstFocusable = containerRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && isActive) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}
