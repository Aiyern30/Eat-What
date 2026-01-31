"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Restaurant, FilterState, Location } from "@/types/restaurant";
import { useGeolocation } from "@/hooks/use-geolocation";
import { usePlaces } from "@/hooks/use-places";
import { calculateDistance, isRestaurantOpen } from "@/lib/utils";
import { FilterPanel } from "@/components/filter-panel";
import { RestaurantList } from "@/components/restaurant-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, List, MapPin, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { GoogleMap } from "@/components/google-map";
import { RestaurantDetails } from "@/components/restaurant-details";
import { UserMenu } from "@/components/UserMenu";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { DecisionWheel } from "@/components/decision-wheel";

const DEFAULT_CENTER: Location = {
  lat: 3.139, // Kuala Lumpur center
  lng: 101.6869,
};

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    areas: [],
    distance: 15,
    cuisines: [],
    dietary: [],
    priceRange: [],
    minRating: 0,
    openNow: false,
    resultLimit: 50,
  });

  // Global Search Query - Used for finding NEW locations ("Explore")
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Local Filter Query - Used for filtering CURRENT results ("Filter")
  const [filterQuery, setFilterQuery] = useState("");

  // Track if we are in "Explore Mode" (Global Search) vs "Nearby Mode"
  const [isExploreMode, setIsExploreMode] = useState(false);

  const [mapCenter, setMapCenter] = useState<Location>(DEFAULT_CENTER);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  const hasInitializedLocation = useRef(false);
  const hasSearchedPlaces = useRef(false);

  const { location, error, loading, getCurrentLocation } = useGeolocation();
  const {
    restaurants: placesRestaurants,
    loading: placesLoading,
    error: placesError,
    searchNearby,
    searchByQuery,
    refresh,
  } = usePlaces();

  useEffect(() => {
    // Check if user has seen welcome on mount
    const seen = localStorage.getItem("hasSeenWelcome") === "true";
    setHasSeenWelcome(seen);

    // Only auto-get location if they've already onboarded
    if (seen) {
      getCurrentLocation();
    }
  }, [getCurrentLocation]);

  const handleGlobalSearch = () => {
    if (globalSearchQuery.trim()) {
      setIsExploreMode(true); // Enable Explore Mode
      // Pass the current limit from filters to searchByQuery
      searchByQuery(globalSearchQuery, filters.resultLimit);
      toast.success(`Searching for area: "${globalSearchQuery}"...`);
      // When exploring a new area, we might want to reset local filters to see everything there
      // setFilterQuery("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleGlobalSearch();
    }
  };

  const isMobile = useIsMobile();

  // Update map center and search for nearby restaurants when user location is first obtained
  useEffect(() => {
    if (
      location &&
      !hasInitializedLocation.current &&
      typeof window !== "undefined" &&
      window.google
    ) {
      // This is a valid use case - syncing map center with external location data
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapCenter(location.coords);
      hasInitializedLocation.current = true;

      // Search for nearby restaurants
      if (!hasSearchedPlaces.current) {
        const radiusInMeters = filters.distance * 1000; // Convert km to meters
        searchNearby(location.coords, radiusInMeters, filters.resultLimit);
        hasSearchedPlaces.current = true;
        toast.success("Finding restaurants near you...");
      }
    }
  }, [location, filters.distance, filters.resultLimit, searchNearby]);

  const handleOnboardingComplete = useCallback(() => {
    setHasSeenWelcome(true);
    if (location) {
      const radiusInMeters = filters.distance * 1000;
      searchNearby(location.coords, radiusInMeters, filters.resultLimit);
      hasSearchedPlaces.current = true;
      toast.success("Discovering restaurants near you!");
    }
  }, [location, filters.distance, filters.resultLimit, searchNearby]);

  // Show error toast
  useEffect(() => {
    if (error && hasSeenWelcome) {
      toast.error("Location Error", {
        description: error,
      });
    }
  }, [error, hasSeenWelcome]);

  // Show places error toast
  useEffect(() => {
    if (placesError) {
      toast.error("Restaurant Search Error", {
        description: placesError,
      });
    }
  }, [placesError]);

  // Re-search when distance filter changes (ONLY in Nearby Mode)
  useEffect(() => {
    if (!isExploreMode && location && hasSearchedPlaces.current) {
      const radiusInMeters = filters.distance * 1000;
      searchNearby(location.coords, radiusInMeters, filters.resultLimit);
    }
  }, [
    filters.distance,
    filters.resultLimit,
    location,
    searchNearby,
    isExploreMode,
  ]);

  // Extract available areas from fetched restaurants
  const availableAreas = useMemo(() => {
    const areas = placesRestaurants
      .map((r) => r.area)
      .filter((area) => area && area !== "Unknown");
    // Get unique areas and sort alphabetically
    return Array.from(new Set(areas)).sort();
  }, [placesRestaurants]);

  // Update map center when placesRestaurants change (e.g. after a search)
  useEffect(() => {
    if (placesRestaurants.length > 0 && placesRestaurants[0].location) {
      // Only re-center if we have results and it hasn't been set manually recently
      // For simplicity, always centering on the first result of a new search is good UX for "Search by Text"
      setMapCenter(placesRestaurants[0].location);
    }
  }, [placesRestaurants]);

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    // Use real restaurant data from Places API
    let results = placesRestaurants.map((restaurant) => {
      // Calculate distance if user location is available
      if (location) {
        const distance = calculateDistance(
          location.coords.lat,
          location.coords.lng,
          restaurant.location.lat,
          restaurant.location.lng,
        );
        return { ...restaurant, distance };
      }
      return restaurant;
    });

    // Apply filters
    if (filters.areas.length > 0) {
      results = results.filter((r) => filters.areas.includes(r.area));
    }

    // IMPORTANT: Only apply distance filtering in Nearby Mode
    if (!isExploreMode && location && filters.distance) {
      results = results.filter((r) => r.distance! <= filters.distance);
    }

    if (filters.cuisines.length > 0) {
      results = results.filter((r) =>
        r.cuisine.some((c) => filters.cuisines.includes(c)),
      );
    }

    if (filters.dietary.length > 0) {
      results = results.filter((r) =>
        filters.dietary.some((d) => r.dietaryOptions.includes(d)),
      );
    }

    if (filters.priceRange.length > 0) {
      results = results.filter((r) =>
        filters.priceRange.includes(r.priceRange),
      );
    }

    if (filters.minRating > 0) {
      results = results.filter((r) => r.rating >= filters.minRating);
    }

    if (filters.openNow) {
      results = results.filter((r) => isRestaurantOpen(r.openingHours));
    }

    // Apply LOCAL filter query
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.cuisine.some((c) => c.toLowerCase().includes(query)) ||
          r.area.toLowerCase().includes(query) ||
          r.address.toLowerCase().includes(query),
      );
    }

    // Sort by distance if available
    if (location) {
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return results;
  }, [filters, location, filterQuery, placesRestaurants, isExploreMode]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setMapCenter(restaurant.location);
    setSelectedRestaurant(restaurant);
    if (isMobile) {
      // On mobile, maybe we don't switch view mode anymore if we show a popup?
      // Or we switch to map to see where it is + popup atop?
      // Let's keep existing behavior + popup
      setViewMode("map");
    }
  };

  const handleRefresh = async () => {
    await refresh();
    toast.success("Refreshing restaurant list...");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-linear-to-r from-orange-500 to-red-500 px-4 py-2 md:py-4 text-white shadow-md shrink-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 md:mb-4 flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold md:text-3xl flex items-center gap-2">
              🍽️ <span className="hidden sm:inline">Eat What?</span>
              <span className="sm:hidden font-black tracking-tight">
                EAT WHAT?
              </span>
              <span className="hidden md:inline text-sm font-normal text-white/80 opacity-75">
                - Find food near you
              </span>
            </h1>
            <UserMenu />
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row">
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Where to eat? - Press Enter"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="bg-white pl-10 text-black h-9 md:h-10 shadow-inner text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-0.5 text-gray-400 hover:text-orange-500 h-8 font-bold"
                  onClick={handleGlobalSearch}
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <DecisionWheel
                  restaurants={filteredRestaurants}
                  onSelect={handleRestaurantClick}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  hasSearchedPlaces.current = false;
                  setGlobalSearchQuery("");
                  setIsExploreMode(false);
                  getCurrentLocation();
                  if (location) {
                    const radiusInMeters = filters.distance * 1000;
                    searchNearby(
                      location.coords,
                      radiusInMeters,
                      filters.resultLimit,
                    );
                    toast.success("Finding restaurants near you...");
                  }
                }}
                disabled={loading || placesLoading}
                className="whitespace-nowrap h-9 md:h-10 shadow-sm flex-1 font-bold"
              >
                {loading || placesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {isExploreMode ? "Clear & Near Me" : "Update GPS"}
                </span>
                <span className="ml-1 sm:hidden">
                  {isExploreMode ? "Clear" : "GPS"}
                </span>
              </Button>
            </div>
          </div>
          {location?.address && !globalSearchQuery && (
            <p className="mt-1 text-[10px] text-white/90 flex items-center gap-1 opacity-80 line-clamp-1">
              <MapPin className="h-2.5 w-2.5" />
              {location.address}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Sidebar with filters */}
        {!isMobile && (
          <aside className="w-80 border-r bg-card">
            <div className="h-full overflow-y-auto p-4">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onRefresh={handleRefresh}
                isRefreshing={placesLoading}
                availableAreas={availableAreas}
                searchQuery={filterQuery}
                onSearchChange={setFilterQuery}
              />
              <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">
                  {filteredRestaurants.length} restaurant
                  {filteredRestaurants.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Main View Area */}
        <main className="flex-1 overflow-hidden">
          {isMobile ? (
            // Mobile: Tabs for Map/List view
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "map" | "list")}
              className="flex h-full flex-col"
            >
              <div className="border-b bg-card px-4 py-2">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="map" className="gap-2">
                      <Map className="h-4 w-4" />
                      Map
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                      <List className="h-4 w-4" />
                      List ({filteredRestaurants.length})
                    </TabsTrigger>
                  </TabsList>
                  <FilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    isMobile
                    onRefresh={handleRefresh}
                    isRefreshing={placesLoading}
                    availableAreas={availableAreas}
                    searchQuery={filterQuery}
                    onSearchChange={setFilterQuery}
                  />
                </div>
              </div>
              <TabsContent
                value="map"
                className="m-0 flex-1 relative overflow-hidden"
              >
                <GoogleMap
                  center={mapCenter}
                  restaurants={filteredRestaurants}
                  onRestaurantClick={handleRestaurantClick}
                  userLocation={location?.coords}
                />
              </TabsContent>
              <TabsContent value="list" className="m-0 flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  <RestaurantList
                    restaurants={filteredRestaurants}
                    onRestaurantClick={handleRestaurantClick}
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            // Desktop: Split view
            <div className="flex h-full">
              <div className="h-full flex-1">
                <GoogleMap
                  center={mapCenter}
                  restaurants={filteredRestaurants}
                  onRestaurantClick={handleRestaurantClick}
                  userLocation={location?.coords}
                />
              </div>
              <div className="h-full w-96 border-l bg-card">
                <div className="border-b p-4">
                  <h2 className="font-semibold">
                    {filteredRestaurants.length} Restaurant
                    {filteredRestaurants.length !== 1 ? "s" : ""}
                  </h2>
                </div>
                <RestaurantList
                  restaurants={filteredRestaurants}
                  onRestaurantClick={handleRestaurantClick}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <RestaurantDetails
        restaurant={selectedRestaurant}
        isOpen={!!selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        userLocation={location?.coords}
      />

      <WelcomeDialog
        onEnableLocation={getCurrentLocation}
        locationEnabled={!!location}
        isLocationLoading={loading}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
