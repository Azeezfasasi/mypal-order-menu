// hooks/use-responsive-table.ts
import { useState, useEffect } from "react";

type BreakpointKey = "sm" | "md" | "lg" | "xl" | "2xl";

interface ResponsiveBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

// Desktop-first breakpoints (max-width)
const breakpoints: ResponsiveBreakpoints = {
  "2xl": 1535,
  xl: 1279,
  lg: 1023,
  md: 767,
  sm: 639,
};

export function useResponsiveTable() {
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<BreakpointKey>("2xl");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Determine current breakpoint (desktop-first)
      if (width <= breakpoints.sm) {
        setCurrentBreakpoint("sm");
        setIsMobile(true);
        setIsTablet(false);
      } else if (width <= breakpoints.md) {
        setCurrentBreakpoint("md");
        setIsMobile(false);
        setIsTablet(true);
      } else if (width <= breakpoints.lg) {
        setCurrentBreakpoint("lg");
        setIsMobile(false);
        setIsTablet(true);
      } else if (width <= breakpoints.xl) {
        setCurrentBreakpoint("xl");
        setIsMobile(false);
        setIsTablet(false);
      } else {
        setCurrentBreakpoint("2xl");
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getResponsiveColumnVisibility = (
    columns: Array<{
      id: string;
      meta?: {
        hideOnMobile?: boolean;
        hideOnTablet?: boolean;
        priority?: number;
      };
    }>
  ) => {
    const visibility: Record<string, boolean> = {};

    columns.forEach((column) => {
      const { meta } = column;
      let shouldHide = false;

      if (isMobile && meta?.hideOnMobile) {
        shouldHide = true;
      } else if (isTablet && meta?.hideOnTablet) {
        shouldHide = true;
      }

      visibility[column.id] = !shouldHide;
    });

    return visibility;
  };

  const getColumnClassNames = (meta?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    priority?: number;
  }) => {
    const classes = [];

    if (meta?.hideOnMobile) {
      classes.push("hidden sm:table-cell");
    }
    if (meta?.hideOnTablet) {
      classes.push("hidden lg:table-cell");
    }

    return classes.join(" ");
  };

  return {
    currentBreakpoint,
    isMobile,
    isTablet,
    getResponsiveColumnVisibility,
    getColumnClassNames,
  };
}
