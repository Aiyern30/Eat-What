"use client";

import { useState, useCallback } from "react";
import type { Location, UserLocation } from "@/types/restaurant";

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reverseGeocode = useCallback(async (coords: Location) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      
      if (data.status === "REQUEST_DENIED") {
        console.warn("Geocoding API not enabled. Address lookup disabled.");
        return;
      }
      
      if (data.results && data.results[0]) {
        setLocation((prev) => ({
          coords: prev!.coords,
          address: data.results[0].formatted_address,
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation({ coords });
        setLoading(false);

        // Optionally reverse geocode to get address
        reverseGeocode(coords);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }, [reverseGeocode]);

  return { location, error, loading, getCurrentLocation };
}
