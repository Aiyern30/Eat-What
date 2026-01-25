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
  searchByQuery: (query: string, limit?: number) => Promise<void>;
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
    // Chinese
    chinese: "Chinese",
    中国: "Chinese",
    中華: "Chinese",
    dim_sum: "Chinese",
    dimsum: "Chinese",
    "beef noodle": "Chinese",
    "pork noodle": "Chinese",
    "fish ball": "Chinese",
    wonton: "Chinese",
    dumpling: "Chinese",
    "roast duck": "Chinese",
    "char siew": "Chinese",
    "char siu": "Chinese",
    "chow mein": "Chinese",
    congee: "Chinese",
    porridge: "Chinese",
    cantonese: "Chinese",
    hokkien: "Chinese",
    hakka: "Chinese",
    szechuan: "Chinese",
    sichuan: "Chinese",

    // Malaysian (often overlaps with Chinese)
    malay: "Malay",
    nasi: "Malay",
    "nasi lemak": "Malay",
    "nasi kandar": "Malay",
    mamak: "Malay",
    satay: "Malay",
    rendang: "Malay",
    laksa: "Malay",
    "char kway teow": "Chinese",
    "char kuey teow": "Chinese",
    "hokkien mee": "Chinese",
    "curry mee": "Malay",
    "roti canai": "Malay",

    // Japanese
    japanese: "Japanese",
    日本: "Japanese",
    sushi: "Japanese",
    ramen: "Japanese",
    tempura: "Japanese",
    sashimi: "Japanese",
    udon: "Japanese",
    teriyaki: "Japanese",
    yakitori: "Japanese",
    izakaya: "Japanese",

    // Korean
    korean: "Korean",
    한국: "Korean",
    kimchi: "Korean",
    bibimbap: "Korean",
    bulgogi: "Korean",
    "korean bbq": "Korean",
    gogi: "Korean",

    // BBQ & Hot Pot
    bbq: "BBQ",
    barbecue: "BBQ",
    grill: "BBQ",
    "hot pot": "Hot Pot",
    hotpot: "Hot Pot",
    steamboat: "Hot Pot",
    shabu: "Hot Pot",

    // Indian
    indian: "Indian",
    curry: "Indian",
    tandoori: "Indian",
    biryani: "Indian",
    masala: "Indian",
    tikka: "Indian",

    // Italian
    italian: "Italian",
    pizza: "Italian",
    pasta: "Italian",
    pizzeria: "Italian",
    trattoria: "Italian",

    // Thai
    thai: "Thai",
    ไทย: "Thai",
    tom_yum: "Thai",
    "tom yum": "Thai",
    pad_thai: "Thai",
    "pad thai": "Thai",
    "green curry": "Thai",
    "red curry": "Thai",

    // Vietnamese
    vietnamese: "Vietnamese",
    việt: "Vietnamese",
    pho: "Vietnamese",
    "banh mi": "Vietnamese",
    "spring roll": "Vietnamese",

    // Mexican
    mexican: "Mexican",
    taco: "Mexican",
    burrito: "Mexican",
    enchilada: "Mexican",

    // Western
    western: "Western",
    steak: "Western",
    burger: "Western",
    american: "Western",
    bistro: "Western",

    // Cafe & Bakery
    cafe: "Cafe",
    coffee: "Cafe",
    espresso: "Cafe",
    latte: "Cafe",
    bakery: "Bakery",
    bread: "Bakery",
    patisserie: "Bakery",

    // Fast Food
    "fast food": "Fast Food",
    "fried chicken": "Fast Food",
    kfc: "Fast Food",
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

// Extract city/state from vicinity address
const extractLocation = (vicinity?: string): string => {
  if (!vicinity) return "Unknown";

  // Split by comma and get the last meaningful part (usually city or state)
  const parts = vicinity
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p);

  // Common Malaysian states and cities
  const locations = [
    "Selangor",
    "Kuala Lumpur",
    "KL",
    "Puchong",
    "Petaling Jaya",
    "PJ",
    "Subang Jaya",
    "Shah Alam",
    "Klang",
    "Kajang",
    "Cheras",
    "Ampang",
    "Mont Kiara",
    "Bangsar",
    "KLCC",
    "Bukit Bintang",
    "Damansara",
    "Putrajaya",
    "Cyberjaya",
    "Seri Kembangan",
    "Bangi",
  ];

  // Find the first part that matches a known location
  for (const part of parts) {
    for (const location of locations) {
      if (part.toLowerCase().includes(location.toLowerCase())) {
        return location;
      }
    }
  }

  // If no match, return the last part (usually city/area)
  return parts[parts.length - 1] || "Unknown";
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
                      area: extractLocation(place.vicinity),
                      phoneNumber: "",
                      photoUrl:
                        place.photos?.[0]?.getUrl({ maxWidth: 400 }) ||
                        "/placeholder-restaurant.jpg",
                      dietaryOptions: [] as DietaryOption[],
                      openingHours: [],
                      isOpen: place.opening_hours?.isOpen?.() ?? undefined,
                      userRatingsTotal: place.user_ratings_total,
                      // The Google Maps JavaScript API types might not explicitly include these boolean flags in all versions of the typedefs,
                      // but they are often present in the result object for restaurants.
                      // We'll fallback to checking types array if direct booleans aren't there (though types are less reliable for 'no delivery').
                      dineIn: (place as any).dine_in,
                      takeout: (place as any).takeout,
                      delivery: (place as any).delivery,
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

  const searchByQuery = useCallback(
    async (query: string, limit: number = 50) => {
      setLoading(true);
      setError(null);

      try {
        if (!window.google) {
          throw new Error("Google Maps not loaded");
        }

        const service = new google.maps.places.PlacesService(
          document.createElement("div"),
        );

        const request: google.maps.places.TextSearchRequest = {
          query: query,
          type: "restaurant",
        };

        let allResults: google.maps.places.PlaceResult[] = [];

        const fetchPage = (pageTokenParam?: string) => {
          // textSearch doesn't accept pageToken in the request object directly quite the same as nearbySearch in strict types sometimes,
          // but the JS API handles it via the pagination object causing a new request.
          // HOWEVER, for textSearch, the pagination mechanics are slightly different or standard.
          // Actually, for textSearch, we use the pagination argument in the callback to fetch next page.

          service.textSearch(request, (results, status, pagination) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              allResults = [...allResults, ...results];

              if (allResults.length < limit && pagination?.hasNextPage) {
                // Wait 2 seconds before requesting next page
                setTimeout(() => {
                  pagination.nextPage();
                }, 2000);
              } else {
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
                      address: place.vicinity || place.formatted_address || "",
                      area: extractLocation(
                        place.formatted_address || place.vicinity,
                      ),
                      phoneNumber: "",
                      photoUrl:
                        place.photos?.[0]?.getUrl({ maxWidth: 400 }) ||
                        "/placeholder-restaurant.jpg",
                      dietaryOptions: [] as DietaryOption[],
                      openingHours: [],
                      isOpen: place.opening_hours?.isOpen?.() ?? undefined,
                      userRatingsTotal: place.user_ratings_total,
                      dineIn: (place as any).dine_in,
                      takeout: (place as any).takeout,
                      delivery: (place as any).delivery,
                    };
                  });

                setRestaurants(mappedRestaurants);
                setLoading(false);
              }
            } else {
              // If we already have some results, don't error out completely, just show what we have
              if (allResults.length > 0) {
                // Map what we have
                const mappedRestaurants = allResults
                  .slice(0, limit)
                  .map((place, index) => {
                    // ... same mapping logic (simplified for brevity here, but in real code must be duplicated or extracted)
                    // To avoid code duplication in this simplified view, effectively we end up calling setRestaurants with what we have
                    // For this "Replace" block, I will just copy the mapping logic since I can't easily extract it to a function in this localized edit without changing more code.
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
                      address: place.vicinity || place.formatted_address || "",
                      area: extractLocation(
                        place.formatted_address || place.vicinity,
                      ),
                      phoneNumber: "",
                      photoUrl:
                        place.photos?.[0]?.getUrl({ maxWidth: 400 }) ||
                        "/placeholder-restaurant.jpg",
                      dietaryOptions: [],
                      openingHours: [],
                      isOpen: place.opening_hours?.isOpen?.() ?? undefined,
                      userRatingsTotal: place.user_ratings_total,
                      dineIn: (place as any).dine_in,
                      takeout: (place as any).takeout,
                      delivery: (place as any).delivery,
                    };
                  });
                setRestaurants(mappedRestaurants);
                setLoading(false);
              } else {
                setError(`Failed to search restaurants: ${status}`);
                setLoading(false);
              }
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
    searchByQuery,
    refresh,
  };
}
