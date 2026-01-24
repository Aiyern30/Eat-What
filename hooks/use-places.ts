"use client";

import { useState, useCallback } from "react";
import {
  Restaurant,
  Location,
  CuisineType,
  DietaryOption,
  PriceRange,
} from "@/types/restaurant";

interface UsePlacesResult {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  searchNearby: (
    location: Location,
    radius?: number,
    limit?: number,
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

// Map Google Places types to our cuisine types - enhanced with keyword matching
const mapPlaceTypeToCuisine = (
  types: string[],
  name: string,
): CuisineType[] => {
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

  // Keyword patterns for cuisine detection in restaurant names
  const keywordPatterns: Record<string, CuisineType> = {
    chinese: "Chinese",
    dim_sum: "Chinese",
    noodle: "Chinese",
    wonton: "Chinese",
    japanese: "Japanese",
    sushi: "Japanese",
    ramen: "Japanese",
    tempura: "Japanese",
    korean: "Korean",
    kimchi: "Korean",
    bbq: "BBQ",
    korean_bbq: "Korean",
    indian: "Indian",
    curry: "Indian",
    tandoori: "Indian",
    biryani: "Indian",
    italian: "Italian",
    pizza: "Italian",
    pasta: "Italian",
    thai: "Thai",
    tom_yum: "Thai",
    pad_thai: "Thai",
    vietnamese: "Vietnamese",
    pho: "Vietnamese",
    banh_mi: "Vietnamese",
    mexican: "Mexican",
    taco: "Mexican",
    burrito: "Mexican",
    western: "Western",
    steak: "Western",
    burger: "Western",
    malay: "Malay",
    nasi: "Malay",
    mamak: "Malay",
    satay: "Malay",
    hot_pot: "Hot Pot",
    steamboat: "Hot Pot",
    cafe: "Cafe",
    coffee: "Cafe",
    bakery: "Bakery",
    bread: "Bakery",
  };

  const cuisines: CuisineType[] = [];

  // Check for specific cuisine types from Google
  for (const type of types) {
    if (cuisineMap[type]) {
      cuisines.push(cuisineMap[type]);
    }
  }

  // Check restaurant name for cuisine keywords
  const nameLower = name.toLowerCase();
  for (const [keyword, cuisine] of Object.entries(keywordPatterns)) {
    if (
      nameLower.includes(keyword.replace(/_/g, " ")) ||
      nameLower.includes(keyword)
    ) {
      if (!cuisines.includes(cuisine)) {
        cuisines.push(cuisine);
      }
    }
  }

  // If no specific cuisine found, default to Asian for restaurants
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
  const [lastSearchParams, setLastSearchParams] = useState<{
    location: Location;
    radius: number;
    limit: number;
  } | null>(null);

  const searchNearby = useCallback(
    async (location: Location, radius: number = 5000, limit: number = 50) => {
      setLoading(true);
      setError(null);
      setLastSearchParams({ location, radius, limit });

      try {
        // Load Google Maps library
        if (!window.google) {
          throw new Error("Google Maps not loaded");
        }

        const service = new google.maps.places.PlacesService(
          document.createElement("div"),
        );

        const request: google.maps.places.PlaceSearchRequest = {
          location: new google.maps.LatLng(location.lat, location.lng),
          radius,
          type: "restaurant",
        };

        let allResults: google.maps.places.PlaceResult[] = [];
        const seenPlaceIds = new Set<string>();

        const fetchPage = (pageTokenParam?: string) => {
          const pageRequest = pageTokenParam
            ? { ...request, pageToken: pageTokenParam }
            : request;

          service.nearbySearch(pageRequest, (results, status, pagination) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              // Filter out duplicates
              const newResults = results.filter((place) => {
                const placeId = place.place_id;
                if (!placeId || seenPlaceIds.has(placeId)) {
                  return false;
                }
                seenPlaceIds.add(placeId);
                return true;
              });

              allResults = [...allResults, ...newResults];

              // Check if we need more results and pagination is available
              if (allResults.length < limit && pagination?.hasNextPage) {
                // Wait 2 seconds before requesting next page (Google requirement)
                setTimeout(() => {
                  pagination.nextPage();
                }, 2000);
              } else {
                // Map and set results
                const mappedRestaurants: Restaurant[] = allResults
                  .slice(0, limit)
                  .map((place, index) => {
                    const restaurantName = place.name || "Unknown Restaurant";
                    const cuisine = mapPlaceTypeToCuisine(
                      place.types || [],
                      restaurantName,
                    );
                    const priceLevel = place.price_level || 2;

                    return {
                      id: place.place_id || `place-${index}`,
                      name: restaurantName,
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
                      photoUrl:
                        place.photos?.[0]?.getUrl({ maxWidth: 400 }) ||
                        "/placeholder-restaurant.jpg",
                      dietaryOptions: [] as DietaryOption[],
                      openingHours: [],
                      isOpen: place.opening_hours?.isOpen?.() ?? undefined,
                    };
                  });

                setRestaurants(mappedRestaurants);
                setLoading(false);
              }
            } else {
              setError(`Failed to fetch restaurants: ${status}`);
              setLoading(false);
            }
          });
        };

        fetchPage();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setLoading(false);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (lastSearchParams) {
      // Create a slightly offset location to get different results
      const offsetLat =
        lastSearchParams.location.lat + (Math.random() - 0.5) * 0.001;
      const offsetLng =
        lastSearchParams.location.lng + (Math.random() - 0.5) * 0.001;

      await searchNearby(
        { lat: offsetLat, lng: offsetLng },
        lastSearchParams.radius,
        lastSearchParams.limit,
      );
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
