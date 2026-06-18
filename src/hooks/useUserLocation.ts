import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UseUserLocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

/**
 * Custom hook for requesting and managing user's geolocation
 * @param autoRequest - Whether to automatically request location on mount
 * @returns Object containing location data, loading state, error, and requestLocation function
 */
export function useUserLocation(autoRequest = false): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = "Failed to retrieve your location";

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        setError(errorMessage);
        setLoading(false);
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  return { location, loading, error, requestLocation };
}
