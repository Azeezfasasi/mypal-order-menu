"use client";

import { useEffect, useRef } from "react";
import type { LatLngExpression, Map, Marker, LeafletMouseEvent, Polyline } from "leaflet";

interface DeliveryZoneMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialCoords?: { lat: number; lng: number };
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  onPickupSelect?: (lat: number, lng: number) => void;
  onDropoffSelect?: (lat: number, lng: number) => void;
  mode?: "single" | "route"; // 'single' for zone center, 'route' for pickup/dropoff
}

export default function DeliveryZoneMap({
  onLocationSelect,
  initialCoords,
  pickupCoords,
  dropoffCoords,
  onPickupSelect,
  onDropoffSelect,
  mode = "single",
}: DeliveryZoneMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const pickupMarkerRef = useRef<Marker | null>(null);
  const dropoffMarkerRef = useRef<Marker | null>(null);
  const polylineRef = useRef<Polyline | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((leafletModule) => {
      const L = leafletModule as typeof import("leaflet");
      if (!mapContainer.current || mapRef.current) return;

      // Fix Leaflet icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "/marker-icon.png",
        iconRetinaUrl: "/marker-icon-2x.png",
        shadowUrl: "/marker-shadow.png",
      });

      // Initialize map
      const defaultCoords: LatLngExpression = pickupCoords
        ? [pickupCoords.lat, pickupCoords.lng]
        : initialCoords
          ? [initialCoords.lat, initialCoords.lng]
          : [6.5244, 3.3792]; // Default to Lagos, Nigeria if no coords

      const map = L.map(mapContainer.current).setView(defaultCoords, 13);

      // Add OpenStreetMap tiles (free, no API key needed)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Handle different modes
      if (mode === "route" && onPickupSelect && onDropoffSelect) {
        // Route mode: show pickup and dropoff with polyline
        
        // Add pickup marker (green)
        if (pickupCoords) {
          const pickupIcon = L.icon({
            iconUrl: "/marker-icon.png",
            iconRetinaUrl: "/marker-icon-2x.png",
            shadowUrl: "/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            className: "pickup-marker",
          });

          const marker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
            .addTo(map)
            .bindPopup(
              `<div class="font-semibold text-green-700">📍 Pickup<br/>Latitude: ${pickupCoords.lat.toFixed(6)}<br/>Longitude: ${pickupCoords.lng.toFixed(6)}</div>`,
            );
          pickupMarkerRef.current = marker;
        }

        // Add dropoff marker (blue)
        if (dropoffCoords) {
          const dropoffIcon = L.icon({
            iconUrl: "/marker-icon.png",
            iconRetinaUrl: "/marker-icon-2x.png",
            shadowUrl: "/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            className: "dropoff-marker",
          });

          const marker = L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: dropoffIcon })
            .addTo(map)
            .bindPopup(
              `<div class="font-semibold text-blue-700">📍 Dropoff<br/>Latitude: ${dropoffCoords.lat.toFixed(6)}<br/>Longitude: ${dropoffCoords.lng.toFixed(6)}</div>`,
            );
          dropoffMarkerRef.current = marker;
        }

        // Draw polyline between pickup and dropoff
        if (pickupCoords && dropoffCoords) {
          const polyline = L.polyline(
            [[pickupCoords.lat, pickupCoords.lng], [dropoffCoords.lat, dropoffCoords.lng]],
            {
              color: "#2563eb",
              weight: 3,
              opacity: 0.8,
              dashArray: "5, 5",
            },
          ).addTo(map);
          polylineRef.current = polyline;

          // Fit map bounds to show both markers
          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }

        // Handle map clicks for pickup/dropoff selection
        let clickCount = 0;
        map.on("click", (e: LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;

          if (clickCount === 0) {
            // First click - set pickup
            if (pickupMarkerRef.current) {
              pickupMarkerRef.current.remove();
            }

            const pickupIcon = L.icon({
              iconUrl: "/marker-icon.png",
              iconRetinaUrl: "/marker-icon-2x.png",
              shadowUrl: "/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              className: "pickup-marker",
            });

            const marker = L.marker([lat, lng], { icon: pickupIcon })
              .addTo(map!)
              .bindPopup(`<div class="font-semibold text-green-700">📍 Pickup</div>`)
              .openPopup();

            pickupMarkerRef.current = marker;
            onPickupSelect(lat, lng);
            clickCount++;
          } else {
            // Second click - set dropoff
            if (dropoffMarkerRef.current) {
              dropoffMarkerRef.current.remove();
            }

            const dropoffIcon = L.icon({
              iconUrl: "/marker-icon.png",
              iconRetinaUrl: "/marker-icon-2x.png",
              shadowUrl: "/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              className: "dropoff-marker",
            });

            const marker = L.marker([lat, lng], { icon: dropoffIcon })
              .addTo(map!)
              .bindPopup(`<div class="font-semibold text-blue-700">📍 Dropoff</div>`)
              .openPopup();

            dropoffMarkerRef.current = marker;
            onDropoffSelect(lat, lng);

            // Draw polyline
            if (pickupMarkerRef.current) {
              if (polylineRef.current) {
                polylineRef.current.remove();
              }

              const pickupLatLng = pickupMarkerRef.current.getLatLng();
              const polyline = L.polyline([[pickupLatLng.lat, pickupLatLng.lng], [lat, lng]], {
                color: "#2563eb",
                weight: 3,
                opacity: 0.8,
                dashArray: "5, 5",
              }).addTo(map!);
              polylineRef.current = polyline;
            }

            clickCount = 0; // Reset for next set
          }
        });
      } else {
        // Single mode: show only zone center marker
        // Add initial marker if coordinates are provided
        if (initialCoords) {
          const marker = L.marker([initialCoords.lat, initialCoords.lng])
            .addTo(map)
            .bindPopup(
              `Latitude: ${initialCoords.lat.toFixed(6)}<br>Longitude: ${initialCoords.lng.toFixed(6)}`,
            );
          markerRef.current = marker;
        }

        // Handle map clicks to set location
        map.on("click", (e: LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;

          // Remove old marker if exists
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const newMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(
              `Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`,
            )
            .openPopup();

          markerRef.current = newMarker;

          // Callback to parent component
          onLocationSelect(lat, lng);
        });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect, initialCoords, mode, onPickupSelect, onDropoffSelect, pickupCoords, dropoffCoords]);

  // Update markers when coordinates change (from address search)
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule as typeof import("leaflet");

      if (mode === "route") {
        // Update pickup marker
        if (pickupCoords) {
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.remove();
          }

          const pickupIcon = L.icon({
            iconUrl: "/marker-icon.png",
            iconRetinaUrl: "/marker-icon-2x.png",
            shadowUrl: "/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            className: "pickup-marker",
          });

          const marker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
            .addTo(mapRef.current!)
            .bindPopup(
              `<div class="font-semibold text-green-700">📍 Pickup</div>`,
            );

          pickupMarkerRef.current = marker;
        }

        // Update dropoff marker
        if (dropoffCoords) {
          if (dropoffMarkerRef.current) {
            dropoffMarkerRef.current.remove();
          }

          const dropoffIcon = L.icon({
            iconUrl: "/marker-icon.png",
            iconRetinaUrl: "/marker-icon-2x.png",
            shadowUrl: "/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            className: "dropoff-marker",
          });

          const marker = L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: dropoffIcon })
            .addTo(mapRef.current!)
            .bindPopup(
              `<div class="font-semibold text-blue-700">📍 Dropoff</div>`,
            );

          dropoffMarkerRef.current = marker;
        }

        // Update polyline
        if (pickupCoords && dropoffCoords) {
          if (polylineRef.current) {
            polylineRef.current.remove();
          }

          const polyline = L.polyline(
            [[pickupCoords.lat, pickupCoords.lng], [dropoffCoords.lat, dropoffCoords.lng]],
            {
              color: "#2563eb",
              weight: 3,
              opacity: 0.8,
              dashArray: "5, 5",
            },
          ).addTo(mapRef.current!);
          polylineRef.current = polyline;

          // Fit map bounds to show both markers
          mapRef.current!.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        } else if (pickupCoords) {
          mapRef.current!.setView([pickupCoords.lat, pickupCoords.lng], 13);
        }
      } else {
        // Single mode: update main marker
        if (initialCoords) {
          if (markerRef.current) {
            markerRef.current.remove();
          }

          const marker = L.marker([initialCoords.lat, initialCoords.lng])
            .addTo(mapRef.current!)
            .bindPopup(
              `Latitude: ${initialCoords.lat.toFixed(6)}<br>Longitude: ${initialCoords.lng.toFixed(6)}`,
            )
            .openPopup();

          markerRef.current = marker;

          // Pan to the new location
          mapRef.current!.setView([initialCoords.lat, initialCoords.lng], 13);
        }
      }
    });
  }, [initialCoords, pickupCoords, dropoffCoords, mode]);

  return (
    <div className="relative z-10">
      <div
        ref={mapContainer}
        className="h-64 w-full rounded-lg border border-gray-300"
      />
      <p className="mt-2 text-xs text-gray-600">
        {mode === "route" ? (
          <>💡 Click twice on the map: first for <span className="font-semibold text-green-600">pickup</span>, then for <span className="font-semibold text-blue-600">dropoff</span> location</>
        ) : (
          <>💡 Click on the map to select a location for your delivery zone</>
        )}
      </p>
    </div>
  );
}
