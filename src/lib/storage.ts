// @/lib/storage
import { setCookie, getCookie, deleteCookie } from "cookies-next";

// Define an interface for storage operations
export interface StorageAdapter {
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null; // Should return string | null
  removeItem: (key: string) => void;
}

export const secureStorage: StorageAdapter = {
  setItem: (key: string, value: string) => {
    console.log(`Storing key '${key}'. Value size: ${value.length} bytes.`);
    // If size > 4000, log a warning:
    if (value.length > 4000) {
      console.warn(
        `Potential cookie size issue for key '${key}'. Size: ${value.length}`
      );
    }
    // console.log("Value:", value); // Careful: Might log sensitive data
    setCookie(key, value, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  },
  getItem: (key: string) => {
    const value = getCookie(key) as string | undefined;
    // console.log(`Getting key '${key}'. Found value:`, value);
    return value === undefined ? null : value; // Ensure null is returned if undefined
  },
  removeItem: (key: string) => {
    console.log(`Removing key '${key}'`);
    deleteCookie(key);
  },
};

/// @/lib/storage.ts - Example using localStorage

// Check if localStorage is available (important for SSR or specific environments)
const storageAvailable = typeof window !== "undefined" && window.localStorage;

export const localStorageAdapter: StorageAdapter = {
  setItem: (key: string, value: string): void => {
    if (storageAvailable) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error(`Error setting localStorage item "${key}":`, e);
      }
    } else {
      console.warn("localStorage not available. Cannot set item:", key);
    }
  },
  getItem: (key: string): string | null => {
    if (storageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error(`Error getting localStorage item "${key}":`, e);
        return null;
      }
    } else {
      console.warn("localStorage not available. Cannot get item:", key);
      return null;
    }
  },
  removeItem: (key: string): void => {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error(`Error removing localStorage item "${key}":`, e);
      }
    } else {
      console.warn("localStorage not available. Cannot remove item:", key);
    }
  },
};
