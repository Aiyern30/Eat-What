"use client";

import { useState, useCallback } from "react";
import { Restaurant, Location, CuisineType, DietaryOption, PriceRange } from "@/types/restaurant";

interface UsePlacesResult {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  searchNearby: (location: Location, radius?: number, limit?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

// Map Google Places types to our cuisine types
const mapPlaceTypeToCuisine = (types: string[]): CuisineType[] => {
  const cuisineMap: Record<string, CuisineType> = {
    chinese_restaurant: "Chinese",
    japanese_restaurant: "Japanese",
    korean_restaurant: "Korean",
    indian_restaurant: "Indian",
    italian_restaurant: "Italian",
    thai_restaurant: "Thai",
    vietnamese_restaurant: "Vietnamese",
    mexican_restaurant: "Mexican",
    american_restaurant: "Western",
    french_restaurant: "Western",
    cafe: "Cafe",
    bakery: "Bakery",
  };

  const cuisines: CuisineType[] = [];
  
  // Check for specific cuisine types
  for (const type of types) {
    if (cuisineMap[type]) {
      cuisines.push(cuisineMap[type]);
    }
  }

  // If no specific cuisine found, check for generic restaurant
  if (cuisines.length === 0) {
    if (types.includes("restaurant") || types.includes("food")) {
      cuisines.push("Asian");
    }
  }

  return cuisines.length > 0 ? cuisines : ["Asian"];
};

// Map price level to our price range
const mapPriceLevel = (priceLevel?: number): PriceRange => {
  if (!priceLevel) return "$$";
  if (priceLevel === 1) return "$";
  if (priceLevel === 2) return "$$";
  if (priceLevel === 3) return "$$$";
  if (priceLevel === 4) return "$$$$";
  return "$$";
};

export function usePlaces(): UsePlacesResult {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<{ location: Location; radius: number; limit: number } | null>(null);

  const searchNearby = useCallback(async (location: Location, radius: number = 5000, limit: number = 50) => {
    setLoading(true);
    setError(null);
    setLastSearchParams({ location, radius, limit });

    try {
      // Load Google Maps library
      if (!window.google) {
        throw new Error("Google Maps not loaded");
      }

      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type: "restaurant",
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const mappedRestaurants: Restaurant[] = results.slice(0, limit).map((place, index) => {
            const cuisine = mapPlaceTypeToCuisine(place.types || []);
            const priceLevel = place.price_level || 2;
            
            return {
              id: place.place_id || `place-${index}`,
              name: place.name || "Unknown Restaurant",
              cuisine,
              rating: place.rating || 0,
              priceRange: mapPriceLevel(priceLevel),
              priceLevel: priceLevel,
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              address: place.vicinity || "",
              area: place.vicinity?.split(",")[0] || "Unknown",
              phoneNumber: "",
              photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || "/placeholder-restaurant.jpg",
              dietaryOptions: [] as DietaryOption[],
              openingHours: [],
              isOpen: place.opening_hours?.isOpen?.() ?? undefined,
            };
          });

          setRestaurants(mappedRestaurants);
          setLoading(false);
        } else {
          setError(`Failed to fetch restaurants: ${status}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (lastSearchParams) {
      await searchNearby(lastSearchParams.location, lastSearchParams.radius, lastSearchParams.limit);
    }
  }, [lastSearchParams, searchNearby]);

  return {
    restaurants,
    loading,
    error,
    searchNearby,
    refresh,
  };
}
