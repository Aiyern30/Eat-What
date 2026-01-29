"use client";

import {
  useLoadScript,
  GoogleMap as GoogleMapComponent,
  MarkerF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import { useState, useMemo, useRef, useCallback } from "react";
import { Restaurant, Location } from "@/types/restaurant";
import { MAP_STYLES } from "@/data/map-styles";
import { Spinner } from "@/components/ui/spinner";
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  Navigation,
  Layers,
  Check,
} from "lucide-react";
import Image from "next/image";

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

// Custom map styles are imported from @/data/map-styles

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
  const [mapTheme, setMapTheme] = useState<
    "standard" | "dark" | "retro" | "satellite" | "hybrid"
  >("standard");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

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

  const mapOptions = useMemo<google.maps.MapOptions>(() => {
    const isSatellite = mapTheme === "satellite" || mapTheme === "hybrid";

    return {
      disableDefaultUI: false,
      clickableIcons: false,
      scrollwheel: true,
      mapTypeControl: false,
      fullscreenControl: !minimal,
      streetViewControl: false,
      zoomControl: !minimal,
      // Map Type & Styles
      mapTypeId: isSatellite ? mapTheme : "roadmap",
      styles: isSatellite
        ? undefined
        : MAP_STYLES[mapTheme as keyof typeof MAP_STYLES] ||
          MAP_STYLES.standard,
    };
  }, [minimal, mapTheme]);

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
        onLoad={onLoad}
        onUnmount={onUnmount}
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
                styles: MAP_STYLES.standard,
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
            <div className="w-[280px] overflow-hidden">
              <div className="relative h-32 w-full bg-gray-100">
                {hoveredRestaurant.photoUrl ? (
                  <Image
                    src={hoveredRestaurant.photoUrl}
                    alt={hoveredRestaurant.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                    <MapPin className="h-8 w-8 opacity-20" />
                  </div>
                )}
                {/* Overlay Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold shadow-xs">
                    {hoveredRestaurant.distance
                      ? `${hoveredRestaurant.distance.toFixed(1)}km`
                      : "Nearby"}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-bold text-base mb-1 text-gray-900 line-clamp-1">
                  {hoveredRestaurant.name}
                </h3>

                <div className="flex flex-wrap gap-1 mb-2">
                  {hoveredRestaurant.cuisine.slice(0, 3).map((cuisine) => (
                    <span
                      key={cuisine}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 font-medium">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span>{hoveredRestaurant.rating}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="text-gray-600">
                      {(() => {
                        const level = hoveredRestaurant.priceLevel;
                        if (level === 1) return "RM 10–20";
                        if (level === 2) return "RM 20–40";
                        if (level === 3) return "RM 40–100";
                        if (level && level >= 4) return "RM 100+";

                        const range = hoveredRestaurant.priceRange;
                        if (range?.length === 1) return "RM 10–20";
                        if (range?.length === 2) return "RM 20–40";
                        if (range?.length === 3) return "RM 40–100";
                        if (range?.length >= 4) return "RM 100+";

                        return "Price hidden";
                      })()}
                    </div>
                  </div>
                </div>
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
            <div className="w-[300px] overflow-hidden">
              {/* Image Header */}
              <div className="relative h-40 w-full bg-gray-100">
                {selectedRestaurant.photoUrl ? (
                  <Image
                    src={selectedRestaurant.photoUrl}
                    alt={selectedRestaurant.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                    <MapPin className="h-10 w-10 opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-green-500 text-white rounded-md text-[10px] font-bold shadow-md">
                    Open Now
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                      {selectedRestaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1 max-w-[200px]">
                        {selectedRestaurant.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 border border-yellow-100 rounded text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" />
                    <span className="font-bold text-yellow-700">
                      {selectedRestaurant.rating}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-700">
                    {(() => {
                      const level = selectedRestaurant.priceLevel;
                      if (level === 1) return "RM 10–20";
                      if (level === 2) return "RM 20–40";
                      if (level === 3) return "RM 40–100";
                      if (level && level >= 4) return "RM 100+";

                      const range = selectedRestaurant.priceRange;
                      if (range?.length === 1) return "RM 10–20";
                      if (range?.length === 2) return "RM 20–40";
                      if (range?.length === 3) return "RM 40–100";
                      if (range?.length >= 4) return "RM 100+";

                      return "Price hidden";
                    })()}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">
                    {selectedRestaurant.cuisine[0]}
                  </span>
                </div>

                <button
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.location.lat},${selectedRestaurant.location.lng}`,
                      "_blank",
                    );
                  }}
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </button>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMapComponent>

      {/* Map Style Selector */}
      {!minimal && (
        <div className="absolute top-16 right-3 z-10 flex flex-col items-end">
          {/* Theme Menu Panel */}
          {showThemeMenu && (
            <div className="absolute top-0 right-14 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[320px] animate-in fade-in slide-in-from-right-5 zoom-in-95 origin-top-right z-20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900">Map Type</h4>
                <button
                  onClick={() => setShowThemeMenu(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: "standard",
                    label: "Default",
                    preview: (
                      <div className="w-full h-full bg-linear-to-br from-gray-50 to-blue-50 relative overflow-hidden">
                        {/* Water bodies */}
                        <div className="absolute bottom-0 right-0 w-16 h-12 bg-blue-200/40 rounded-tl-3xl" />
                        {/* Major roads */}
                        <div className="absolute top-1/3 left-0 w-full h-1 bg-yellow-400 transform -rotate-12" />
                        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-orange-400 transform rotate-6" />
                        {/* Minor roads */}
                        <div className="absolute top-2/3 left-0 w-2/3 h-px bg-gray-300 transform -rotate-6" />
                        <div className="absolute top-1/4 left-1/4 h-full w-px bg-gray-300 transform rotate-12" />
                        {/* Park/green space */}
                        <div className="absolute top-3 left-3 w-6 h-6 bg-green-200/60 rounded" />
                        {/* Building blocks */}
                        <div className="absolute bottom-2 left-4 w-2 h-2 bg-gray-300/50 rounded-sm" />
                      </div>
                    ),
                  },
                  {
                    id: "satellite",
                    label: "Satellite",
                    preview: (
                      <div className="w-full h-full bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 relative overflow-hidden">
                        {/* Terrain texture */}
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-emerald-700/40 to-transparent" />
                          <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-linear-to-t from-teal-800/40 to-transparent" />
                        </div>
                        {/* Forest patches */}
                        <div className="absolute top-2 right-4 w-8 h-6 bg-emerald-950/60 rounded-full blur-[2px]" />
                        <div className="absolute bottom-3 left-2 w-10 h-8 bg-green-950/50 rounded-full blur-[2px]" />
                        {/* Urban area hint */}
                        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-amber-900/30 rounded-sm blur-[1px]" />
                      </div>
                    ),
                  },
                  {
                    id: "hybrid",
                    label: "Hybrid",
                    preview: (
                      <div className="w-full h-full bg-linear-to-br from-emerald-900 via-teal-900 to-emerald-950 relative overflow-hidden">
                        {/* Satellite base with darker overlay */}
                        <div className="absolute inset-0 bg-linear-to-br from-emerald-800/40 to-transparent" />
                        {/* Roads overlay */}
                        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-yellow-300 shadow-sm transform -rotate-12" />
                        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-orange-400 shadow-sm transform rotate-6" />
                        <div className="absolute top-0 left-1/3 h-full w-[2px] bg-white/60 shadow-sm" />
                        {/* Labels hint */}
                        <div className="absolute top-2 left-2 w-8 h-1 bg-white/80 rounded-full shadow-sm" />
                        <div className="absolute bottom-3 right-3 w-6 h-1 bg-white/70 rounded-full shadow-sm" />
                      </div>
                    ),
                  },
                  {
                    id: "dark",
                    label: "Dark",
                    preview: (
                      <div className="w-full h-full bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
                        {/* Water */}
                        <div className="absolute bottom-0 right-0 w-14 h-10 bg-slate-800/60 rounded-tl-3xl" />
                        {/* Roads in dark mode */}
                        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-slate-600 transform -rotate-12" />
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-500 transform rotate-6" />
                        <div className="absolute top-0 left-1/3 h-full w-px bg-slate-700" />
                        {/* Dark mode highlights */}
                        <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500/20 rounded-full" />
                        <div className="absolute bottom-3 left-3 w-2 h-2 bg-slate-700 rounded-full" />
                        {/* Subtle glow */}
                        <div className="absolute top-1/4 left-1/2 w-12 h-12 bg-blue-500/5 rounded-full blur-xl" />
                      </div>
                    ),
                  },
                  {
                    id: "retro",
                    label: "Retro",
                    preview: (
                      <div className="w-full h-full bg-linear-to-br from-[#f4ead5] to-[#e8dcc4] relative overflow-hidden">
                        {/* Vintage paper texture */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.02)_100%)]" />
                        {/* Roads in sepia tones */}
                        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-[#c9b896] transform -rotate-12" />
                        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#b5a485] transform rotate-6" />
                        <div className="absolute top-0 left-1/4 h-full w-[2px] bg-[#d4c5a9]" />
                        {/* Vintage map elements */}
                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#c2ab85]/40 rounded-full" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 bg-[#a89674]/30 rounded-sm" />
                        {/* Aged effect */}
                        <div className="absolute inset-0 bg-linear-to-tr from-amber-900/5 to-transparent" />
                      </div>
                    ),
                  },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setMapTheme(
                        theme.id as
                          | "standard"
                          | "satellite"
                          | "hybrid"
                          | "dark"
                          | "retro",
                      );
                    }}
                    className={`flex flex-col items-center gap-2 group transition-all`}
                  >
                    <div
                      className={`relative w-full aspect-4/3 rounded-xl overflow-hidden shadow-sm border-2 transition-all duration-200 ${
                        mapTheme === theme.id
                          ? "border-blue-600 ring-2 ring-blue-100 scale-105"
                          : "border-gray-200 group-hover:border-gray-300 group-hover:shadow-md"
                      }`}
                    >
                      {theme.preview}
                      {mapTheme === theme.id && (
                        <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                          <div className="bg-blue-600 rounded-full p-0.5 shadow-md">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        mapTheme === theme.id
                          ? "text-blue-600"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            className={`p-3 rounded-full shadow-lg border transition-all duration-300 ${
              showThemeMenu
                ? "bg-gray-900 border-gray-900 text-white rotate-90"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="Change Map Style"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      )}

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

      {/* Legend for marker colors - Moved to Top Left to avoid blocking fullscreen */}
      {!minimal && restaurants.length > 0 && (
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 z-10">
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
