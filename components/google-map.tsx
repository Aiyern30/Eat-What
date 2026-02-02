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
  Navigation,
  Footprints,
  Maximize2,
  Minimize2,
  X,
  Utensils,
  BedDouble,
  Camera,
  Landmark,
  TrainFront,
  Pill,
  CircleDollarSign,
} from "lucide-react";
import Image from "next/image";
import { MapTheme } from "@/types/map";
import { MapThemeSelector } from "@/components/map-theme-selector";
import { SaveButton } from "@/components/save-button";
import { cn } from "@/lib/utils";

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

// Categories Configuration
const CATEGORIES = [
  {
    id: "restaurant",
    label: "Restaurants",
    icon: Utensils,
    type: "restaurant",
  },
  { id: "hotel", label: "Hotels", icon: BedDouble, type: "lodging" },
  {
    id: "attraction",
    label: "Things to do",
    icon: Camera,
    type: "tourist_attraction",
  },
  { id: "museum", label: "Museums", icon: Landmark, type: "museum" },
  {
    id: "transit",
    label: "Transit",
    icon: TrainFront,
    type: "transit_station",
  },
  { id: "pharmacy", label: "Pharmacies", icon: Pill, type: "pharmacy" },
  { id: "atm", label: "ATMs", icon: CircleDollarSign, type: "atm" },
] as const;

// Custom map styles are imported from @/data/map-styles

// Get marker color based on rating or type
const getMarkerColor = (
  rating: number,
  type: string = "restaurant",
): string => {
  if (type === "hotel" || type === "lodging") return "#ec4899"; // pink for hotels

  if (rating >= 4.5) return "#10b981"; // emerald
  if (rating >= 4.0) return "#3b82f6"; // blue
  if (rating >= 3.5) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

const getCategoryIcon = (type: string) => {
  switch (type) {
    case "hotel":
    case "lodging":
      return { path: "M2 22v-5l5-4 5 4v5M12 22v-9 M2 12h10", color: "#ec4899" };
    default:
      return null;
  }
};

// Create custom marker SVG
const createMarkerIcon = (
  rating: number,
  isSelected: boolean = false,
  type: string = "restaurant",
) => {
  const color = getMarkerColor(rating, type);
  const size = isSelected ? 48 : 40;

  // Custom Icon inside marker
  let iconContent = `<circle cx="22" cy="22" r="14" fill="${color}"/>
                     <circle cx="22" cy="22" r="10" fill="white"/>
                     <text x="22" y="26" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">
                       ${rating.toFixed(1)}
                     </text>`;

  if (type === "hotel" || type === "lodging") {
    // Bed Icon
    iconContent = `<circle cx="22" cy="22" r="16" fill="${color}"/>
                   <g transform="translate(13, 13) scale(0.8)">
                     <path d="M2 4v16M22 4v16M2 12h20M2 8h20" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
                     <path d="M12 4v8" stroke="white" stroke-width="2" stroke-linecap="round"/>
                   </g>`;
    // Simplify bed icon for SVG data URI manually to ensure it displays well
    iconContent = `<circle cx="22" cy="22" r="16" fill="${color}"/>
                   <rect x="12" y="14" width="20" height="12" rx="2" fill="white"/>
                   <path d="M12 20h20" stroke="${color}" stroke-width="2"/>
                   <circle cx="16" cy="17" r="1.5" fill="${color}"/>
                   <circle cx="28" cy="17" r="1.5" fill="${color}"/>`;
  }

  const pulseAnimation = isSelected
    ? `<circle cx="22" cy="22" r="18" fill="${color}" opacity="0.3">
         <animate attributeName="r" from="18" to="28" dur="1.5s" repeatCount="indefinite"/>
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
          ${iconContent}
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
  const [mapTheme, setMapTheme] = useState<MapTheme>("standard");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Category & Places State
  const [activeCategory, setActiveCategory] = useState<string>("restaurant");
  const [displayedPlaces, setDisplayedPlaces] =
    useState<Restaurant[]>(restaurants);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );

  // Initialize displayed places when prop changes (if on restaurant tab)
  useMemo(() => {
    if (activeCategory === "restaurant") {
      setDisplayedPlaces(restaurants);
    }
  }, [restaurants, activeCategory]);

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
      streetViewControl: !minimal,
      zoomControl: !minimal,
      // Map Type & Styles
      mapTypeId: isSatellite ? mapTheme : "roadmap",
      styles: isSatellite
        ? undefined
        : MAP_STYLES[mapTheme] || MAP_STYLES.standard,
    };
  }, [minimal, mapTheme]);

  const handleCategoryClick = useCallback(
    (categoryId: string, type: string) => {
      setActiveCategory(categoryId);

      if (categoryId === "restaurant") {
        setDisplayedPlaces(restaurants);
        return;
      }

      if (!mapRef.current) return;

      if (!placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(
          mapRef.current,
        );
      }

      const request = {
        location: center,
        radius: searchRadius,
        type: type,
      };

      placesServiceRef.current?.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Map Google Places results to Restaurant interface
          const mappedPlaces: Restaurant[] = results.map(
            (place) =>
              ({
                id: place.place_id || Math.random().toString(),
                name: place.name || "Unknown",
                cuisine: [categoryId] as any, // Cast for display
                rating: place.rating || 0,
                priceRange: (place.price_level
                  ? "$".repeat(place.price_level)
                  : "$$") as any,
                priceLevel: place.price_level,
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0,
                },
                address: place.vicinity || "",
                area: "",
                photoUrl: place.photos?.[0]?.getUrl() || undefined,
                dietaryOptions: [],
                isOpen: place.opening_hours?.open_now,
                userRatingsTotal: place.user_ratings_total,
                type: type, // Store the type for marker styling
              }) as unknown as Restaurant,
          );

          setDisplayedPlaces(mappedPlaces);
        }
      });
    },
    [center, restaurants, searchRadius],
  );

  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    if (onRestaurantClick) {
      onRestaurantClick(restaurant);
    }
  };

  const handleStreetView = () => {
    if (!mapRef.current || !selectedRestaurant) return;
    const streetView = mapRef.current.getStreetView();
    if (streetView) {
      streetView.setPosition(selectedRestaurant.location);
      streetView.setVisible(true);
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
      {/* Top Navigation Bar */}
      {!minimal && (
        <div className="absolute top-3 left-3 right-14 z-10 flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id, cat.type)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition-all whitespace-nowrap text-sm font-medium",
                  isActive
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

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
        {displayedPlaces.map((restaurant) => (
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
              (restaurant as any).type || "restaurant",
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
            <div className="w-70 overflow-hidden">
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
            <div className="w-75 overflow-hidden">
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
                      <span className="line-clamp-1 max-w-50">
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

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.location.lat},${selectedRestaurant.location.lng}`,
                        "_blank",
                      );
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </button>
                  <button
                    className="flex-0 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all shadow-sm flex items-center justify-center"
                    onClick={handleStreetView}
                    title="Street View"
                  >
                    <Footprints className="w-4 h-4" />
                  </button>
                  <SaveButton
                    restaurantId={selectedRestaurant.id}
                    restaurantName={selectedRestaurant.name}
                    className="flex-1 h-auto py-2.5 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMapComponent>

      {/* Map Style Selector */}
      {!minimal && (
        <div className="absolute top-16 right-3 z-10 flex flex-col items-end">
          <MapThemeSelector
            mapTheme={mapTheme}
            setMapTheme={setMapTheme}
            showThemeMenu={showThemeMenu}
            setShowThemeMenu={setShowThemeMenu}
          />
        </div>
      )}

      {/* Minimal mode overlay stats */}
      {minimal && displayedPlaces.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {displayedPlaces.length}
            </span>
            <span className="text-gray-600">
              {displayedPlaces.length === 1 ? "place" : "places"}
            </span>
          </div>
        </div>
      )}

      {/* Legend for marker colors - Moved to Top Left to avoid blocking fullscreen */}
      {!minimal &&
        activeCategory === "restaurant" &&
        displayedPlaces.length > 0 && (
          <div className="absolute top-16 left-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 z-10 transition-all">
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
