"use client";

import { useEffect, useRef, useState } from "react";
import { Restaurant, Location } from "@/types/restaurant";
import { Spinner } from "@/components/ui/spinner";

interface GoogleMapProps {
  center: Location;
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
  zoom?: number;
  userLocation?: Location;
}

export function GoogleMap({
  center,
  restaurants,
  onRestaurantClick,
  zoom = 12,
  userLocation,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    });

    setMap(mapInstance);
    setLoading(false);
  }, [center, center.lat, center.lng, zoom]);

  // Update center when it changes
  useEffect(() => {
    if (map) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Update user location marker
  useEffect(() => {
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    const userMarker = new google.maps.Marker({
      position: userLocation,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Your Location",
      zIndex: 1000,
    });

    userMarkerRef.current = userMarker;
  }, [map, userLocation]);

  // Update restaurant markers
  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const newMarkers = restaurants.map((restaurant) => {
      const marker = new google.maps.Marker({
        position: restaurant.location,
        map,
        title: restaurant.name,
        icon: {
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMiA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMC40NzcyIDAgNiA0LjQ3NzE1IDYgMTBDNiAxNy41IDE2IDMwIDE2IDMwQzE2IDMwIDI2IDE3LjUgMjYgMTBDMjYgNC40NzcxNSAyMS41MjI4IDAgMTYgMFoiIGZpbGw9IiNGRjU3MjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI0IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==",
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2" style="max-width: 200px;">
            <h3 class="font-semibold text-sm mb-1">${restaurant.name}</h3>
            <p class="text-xs text-gray-600 mb-1">${restaurant.cuisine.join(", ")}</p>
            <div class="flex items-center justify-between text-xs">
              <span>⭐ ${restaurant.rating}</span>
              <span>${restaurant.priceRange}</span>
            </div>
            ${restaurant.distance ? `<p class="text-xs text-gray-500 mt-1">${restaurant.distance.toFixed(1)}km away</p>` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        if (onRestaurantClick) {
          onRestaurantClick(restaurant);
        }
      });

      return marker;
    });

    markersRef.current = newMarkers;
  }, [map, restaurants, onRestaurantClick]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-muted">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full rounded-lg" />;
}
