"use client";

import { Restaurant } from "@/types/restaurant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Star, Navigation } from "lucide-react";
import { formatDistance, isRestaurantOpen } from "@/lib/utils";
import Image from "next/image";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const isOpen = isRestaurantOpen(restaurant.openingHours);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (restaurant.phoneNumber) {
      window.location.href = `tel:${restaurant.phoneNumber}`;
    }
  };

  const formatReviewCount = (count?: number) => {
    if (!count) return "";
    if (count >= 1000) {
      return `(${(count / 1000).toFixed(1)}k)`;
    }
    return `(${count})`;
  };

  const getPriceRangeRM = (level?: number) => {
    switch (level) {
      case 1:
        return "RM 10–20"; // Inexpensive
      case 2:
        return "RM 20–40"; // Moderate
      case 3:
        return "RM 40–100"; // Expensive
      case 4:
        return "RM 100+"; // Very Expensive
      default:
        // Use string length as fallback if numeric level is missing but we have $$$
        if (restaurant.priceRange) {
          const len = restaurant.priceRange.length;
          if (len === 1) return "RM 10–20";
          if (len === 2) return "RM 20–40";
          if (len === 3) return "RM 40–100";
          if (len === 4) return "RM 100+";
        }
        return "Price hidden";
    }
  };

  return (
    <Card
      className="group flex flex-col sm:flex-row cursor-pointer overflow-hidden transition-all hover:shadow-lg h-full py-0"
      onClick={onClick}
    >
      {/* Image Section - Left (Desktop) / Top (Mobile) */}
      <div className="relative h-40 w-full shrink-0 sm:h-auto sm:w-32 bg-muted">
        {restaurant.photoUrl ? (
          <Image
            src={restaurant.photoUrl}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-orange-400 to-red-500">
            <span className="text-3xl">🍽️</span>
          </div>
        )}

        {/* Distance Badge - Overlay on Image */}
        {restaurant.distance !== undefined && (
          <div className="absolute left-1.5 top-1.5">
            <Badge
              variant="secondary"
              className="bg-black/60 text-white backdrop-blur-sm border-0 font-medium text-[10px] px-1.5 h-5 flex items-center"
            >
              {formatDistance(restaurant.distance)}
            </Badge>
          </div>
        )}

        {/* Open/Closed Badge - Overlay on Image */}
        <div className="absolute right-2 top-2 sm:left-1.5 sm:right-auto sm:bottom-1.5 sm:top-auto">
          <Badge
            variant={isOpen ? "default" : "destructive"}
            className={`${isOpen ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} shadow-xs text-[10px] px-1.5 h-5`}
          >
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>

      {/* Content Section - Right */}
      <div className="flex flex-1 flex-col p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-bold text-gray-900 leading-tight w-full">
            {restaurant.name}
          </h3>
        </div>

        {/* Rating, Reviews, Price, Cuisine Row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-600">
          <div className="flex items-center gap-0.5">
            <span className="font-bold text-gray-900">{restaurant.rating}</span>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-muted-foreground">
              {formatReviewCount(restaurant.userRatingsTotal)}
            </span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span>{getPriceRangeRM(restaurant.priceLevel)}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <span className="truncate">{restaurant.cuisine.join(", ")}</span>
        </div>

        {/* Address */}
        <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
          <span className="line-clamp-1">{restaurant.address}</span>
        </div>

        {/* Service Options */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
          {restaurant.dineIn !== undefined && (
            <span
              className={
                restaurant.dineIn
                  ? "text-green-700 font-medium"
                  : "text-gray-400 line-through"
              }
            >
              {restaurant.dineIn ? "✓" : "✕"} Dine-in
            </span>
          )}
          <span className="text-gray-300">|</span>
          {restaurant.takeout !== undefined && (
            <span
              className={
                restaurant.takeout
                  ? "text-green-700 font-medium"
                  : "text-gray-400 line-through"
              }
            >
              {restaurant.takeout ? "✓" : "✕"} Takeaway
            </span>
          )}
        </div>

        {/* Actions - Pushed to right/bottom */}
        <div className="mt-3 flex gap-2 sm:mt-auto pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs px-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCall();
            }}
            disabled={!restaurant.phoneNumber}
          >
            <Phone className="mr-1.5 h-3 w-3" />
            Call
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 flex-1 bg-blue-600 hover:bg-blue-700 text-xs px-2"
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections();
            }}
          >
            <Navigation className="mr-1.5 h-3 w-3" />
            Directions
          </Button>
        </div>
      </div>
    </Card>
  );
}
