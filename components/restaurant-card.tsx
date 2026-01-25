"use client";

import { Restaurant } from "@/types/restaurant";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Star, Navigation } from "lucide-react";
import { formatDistance, isRestaurantOpen } from "@/lib/utils";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const getPriceDescription = (price: string) => {
    switch (price) {
      case "$":
        return "Inexpensive (< RM20)";
      case "$$":
        return "Moderate (RM20 - RM60)";
      case "$$$":
        return "Expensive (RM60 - RM150)";
      case "$$$$":
        return "Very Expensive (> RM150)";
      default:
        return "Price range unknown";
    }
  };

  return (
    <Card
      className="group flex cursor-pointer flex-col transition-all hover:shadow-lg py-0"
      onClick={onClick}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
          {restaurant.photoUrl ? (
            <Image
              src={restaurant.photoUrl}
              alt={restaurant.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-orange-400 to-red-500">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          <div className="absolute right-2 top-2 flex gap-1">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={isOpen ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          {restaurant.distance !== undefined && (
            <div className="absolute left-2 top-2">
              <Badge
                variant="secondary"
                className="bg-black/50 text-white backdrop-blur"
              >
                {formatDistance(restaurant.distance)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold leading-tight">
            {restaurant.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {restaurant.cuisine.join(", ")}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{restaurant.rating}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex cursor-help items-center gap-0.5"
                aria-label={`Price range: ${restaurant.priceRange} - ${getPriceDescription(restaurant.priceRange)}`}
              >
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`text-sm ${
                      level <= restaurant.priceRange.length
                        ? "font-semibold text-orange-500"
                        : "text-muted-foreground/30"
                    }`}
                  >
                    $
                  </span>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getPriceDescription(restaurant.priceRange)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="line-clamp-2">{restaurant.address}</span>
        </div>
        {restaurant.dietaryOptions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {restaurant.dietaryOptions.map((option) => (
              <Badge key={option} variant="outline" className="text-xs">
                {option}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex gap-2 border-t p-4">
        <Button
          variant="default"
          size="sm"
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          onClick={(e) => {
            e.stopPropagation();
            handleGetDirections();
          }}
        >
          <Navigation className="mr-2 h-4 w-4" />
          Directions
        </Button>
        {restaurant.phoneNumber && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCall();
            }}
          >
            <Phone className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
