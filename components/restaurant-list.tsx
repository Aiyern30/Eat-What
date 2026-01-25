"use client";

import { Restaurant } from "@/types/restaurant";
import { RestaurantCard } from "./restaurant-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RestaurantListProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

export function RestaurantList({
  restaurants,
  onRestaurantClick,
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-lg font-semibold">No restaurants found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search in a different area
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-4 p-4 grid-cols-1">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={() => onRestaurantClick?.(restaurant)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
