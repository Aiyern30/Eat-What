"use client";

import {
  useLoadScript,
  GoogleMap as GoogleMapComponent,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { useState, useMemo } from "react";
import { Restaurant, Location } from "@/types/restaurant";
import { Spinner } from "@/components/ui/spinner";

interface GoogleMapProps {
  center: Location;
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
  zoom?: number;
  userLocation?: Location;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
];

export function GoogleMap({
  center,
  restaurants,
  onRestaurantClick,
  zoom = 12,
  userLocation,
}: GoogleMapProps) {
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  const GoogleMapAPI = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!GoogleMapAPI) {
    throw new Error(
      "Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.",
    );
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GoogleMapAPI,
    libraries,
  });

  const mapContainerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
    }),
    [],
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: false,
      clickableIcons: false,
      scrollwheel: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    }),
    [],
  );

  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    if (onRestaurantClick) {
      onRestaurantClick(restaurant);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">
            Failed to load Google Maps
          </p>
          <p className="text-xs text-muted-foreground">
            Please check your API key and try again
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <Spinner className="h-8 w-8 mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapComponent
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={mapOptions}
    >
      {/* User location marker */}
      {userLocation && (
        <MarkerF
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
          title="Your Location"
          zIndex={1000}
        />
      )}

      {/* Restaurant markers */}
      {restaurants.map((restaurant) => (
        <MarkerF
          key={restaurant.id}
          position={restaurant.location}
          title={restaurant.name}
          onClick={() => handleMarkerClick(restaurant)}
          icon={{
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#ef4444"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
          }}
        />
      ))}

      {/* Info window for selected restaurant */}
      {selectedRestaurant && (
        <InfoWindowF
          position={selectedRestaurant.location}
          onCloseClick={() => setSelectedRestaurant(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-sm mb-1">
              {selectedRestaurant.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-1">
              {selectedRestaurant.cuisine.join(", ")}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span>⭐ {selectedRestaurant.rating}</span>
              <span>•</span>
              {/* <span>{"$".repeat(selectedRestaurant.priceLevel)}</span> */}
            </div>
            {selectedRestaurant.distance && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedRestaurant.distance.toFixed(1)}km away
              </p>
            )}
          </div>
        </InfoWindowF>
      )}
    </GoogleMapComponent>
  );
}
