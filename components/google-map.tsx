"use client";

import {
  useLoadScript,
  GoogleMap as GoogleMapComponent,
  MarkerF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import { useState, useMemo } from "react";
import { Restaurant, Location } from "@/types/restaurant";
import { Spinner } from "@/components/ui/spinner";
import { MapPin, Star, Clock, DollarSign, Navigation } from "lucide-react";

interface GoogleMapProps {
  center: Location;
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
  zoom?: number;
  userLocation?: Location;
  minimal?: boolean;
  searchRadius?: number; // in meters
  showRadius?: boolean;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
];

// Custom map styles for a more refined look
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e3f2fd" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e0e0" }],
  },
];

// Get marker color based on rating
const getMarkerColor = (rating: number): string => {
  if (rating >= 4.5) return "#10b981"; // emerald
  if (rating >= 4.0) return "#3b82f6"; // blue
  if (rating >= 3.5) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

// Create custom marker SVG
const createMarkerIcon = (rating: number, isSelected: boolean = false) => {
  const color = getMarkerColor(rating);
  const size = isSelected ? 44 : 36;
  const pulseAnimation = isSelected
    ? `<circle cx="22" cy="22" r="18" fill="${color}" opacity="0.3">
         <animate attributeName="r" from="18" to="26" dur="1.5s" repeatCount="indefinite"/>
         <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite"/>
       </circle>`
    : "";

  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        ${pulseAnimation}
        <g filter="url(#shadow)">
          <circle cx="22" cy="22" r="14" fill="${color}"/>
          <circle cx="22" cy="22" r="10" fill="white"/>
          <text x="22" y="26" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">
            ${rating.toFixed(1)}
          </text>
        </g>
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    `),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
};

export function GoogleMap({
  center,
  restaurants,
  onRestaurantClick,
  zoom = 12,
  userLocation,
  minimal,
  searchRadius = 5000,
  showRadius = false,
}: GoogleMapProps) {
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [hoveredRestaurant, setHoveredRestaurant] = useState<Restaurant | null>(
    null,
  );

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
      borderRadius: minimal ? "12px" : "0px",
    }),
    [minimal],
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: false,
      clickableIcons: false,
      scrollwheel: true,
      styles: mapStyles,
      mapTypeControl: false,
      fullscreenControl: !minimal,
      streetViewControl: false,
      zoomControl: !minimal,
    }),
    [minimal],
  );

  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    if (onRestaurantClick) {
      onRestaurantClick(restaurant);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-600 mb-1">
            Failed to load Google Maps
          </p>
          <p className="text-xs text-gray-500">
            Please check your API key and try again
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center">
          <Spinner className="h-10 w-10 mb-3 text-blue-500" />
          <p className="text-sm font-medium text-gray-700">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={
          minimal
            ? {
                disableDefaultUI: true,
                clickableIcons: false,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: "cooperative",
                styles: mapStyles,
              }
            : mapOptions
        }
      >
        {/* Search radius circle */}
        {showRadius && userLocation && (
          <CircleF
            center={userLocation}
            radius={searchRadius}
            options={{
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
              strokeColor: "#3b82f6",
              strokeOpacity: 0.3,
              strokeWeight: 2,
              clickable: false,
            }}
          />
        )}

        {/* User location marker with enhanced design */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="16" fill="#3b82f6" opacity="0.2">
                    <animate attributeName="r" from="16" to="19" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="20" cy="20" r="12" fill="#3b82f6" opacity="0.3"/>
                  <circle cx="20" cy="20" r="8" fill="#3b82f6"/>
                  <circle cx="20" cy="20" r="5" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            }}
            title="Your Location"
            zIndex={1000}
          />
        )}

        {/* Restaurant markers with enhanced design */}
        {restaurants.map((restaurant) => (
          <MarkerF
            key={restaurant.id}
            position={restaurant.location}
            title={restaurant.name}
            onClick={() => handleMarkerClick(restaurant)}
            onMouseOver={() => !minimal && setHoveredRestaurant(restaurant)}
            onMouseOut={() => !minimal && setHoveredRestaurant(null)}
            icon={createMarkerIcon(
              restaurant.rating,
              selectedRestaurant?.id === restaurant.id,
            )}
            zIndex={selectedRestaurant?.id === restaurant.id ? 999 : 1}
          />
        ))}

        {/* Hover preview - compact tooltip */}
        {!minimal && hoveredRestaurant && !selectedRestaurant && (
          <InfoWindowF
            position={hoveredRestaurant.location}
            options={{
              pixelOffset: new google.maps.Size(0, -20),
              disableAutoPan: true,
            }}
          >
            <div className="px-3 py-2 min-w-[180px]">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                {hoveredRestaurant.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {hoveredRestaurant.rating}
                </span>
                {hoveredRestaurant.distance && (
                  <>
                    <span>•</span>
                    <span>{hoveredRestaurant.distance.toFixed(1)}km</span>
                  </>
                )}
              </div>
            </div>
          </InfoWindowF>
        )}

        {/* Full info window for selected restaurant */}
        {!minimal && selectedRestaurant && (
          <InfoWindowF
            position={selectedRestaurant.location}
            onCloseClick={() => setSelectedRestaurant(null)}
          >
            <div className="p-3 max-w-xs">
              <h3 className="font-bold text-base mb-2 text-gray-900">
                {selectedRestaurant.name}
              </h3>

              {/* Cuisine tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedRestaurant.cuisine.slice(0, 3).map((cuisine) => (
                  <span
                    key={cuisine}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>

              {/* Rating and details */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">
                    {selectedRestaurant.rating}
                  </span>
                  <span className="text-gray-500">(Reviews)</span>
                </div>

                {selectedRestaurant.priceLevel && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">
                      {"$".repeat(selectedRestaurant.priceLevel)}
                    </span>
                  </div>
                )}

                {selectedRestaurant.distance && (
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">
                      {selectedRestaurant.distance.toFixed(1)}km away
                    </span>
                  </div>
                )}

                {/* You can add opening hours here if available */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Open now</span>
                </div>
              </div>

              {/* Action button */}
              <button
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={() => {
                  // Add directions or details action
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.location.lat},${selectedRestaurant.location.lng}`,
                    "_blank",
                  );
                }}
              >
                Get Directions
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMapComponent>

      {/* Minimal mode overlay stats */}
      {minimal && restaurants.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {restaurants.length}
            </span>
            <span className="text-gray-600">
              {restaurants.length === 1 ? "restaurant" : "restaurants"}
            </span>
          </div>
        </div>
      )}

      {/* Legend for marker colors */}
      {!minimal && restaurants.length > 0 && (
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Rating Legend
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">4.5+ Excellent</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">4.0+ Very Good</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-600">3.5+ Good</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600">&lt;3.5 Fair</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
