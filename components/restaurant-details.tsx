"use client";

import { useEffect, useState } from "react";
import { Restaurant } from "@/types/restaurant";
import { usePlaces } from "@/hooks/use-places";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  MapPin,
  Phone,
  Globe,
  Star,
  Clock,
  Navigation,
  Share2,
  ExternalLink,
  Utensils,
  Car,
  ShoppingBag,
  Loader2,
  X,
  Copy,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { formatDistance, isRestaurantOpen } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaveButton } from "@/components/save-button";

interface RestaurantDetailsProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number };
}

export function RestaurantDetails({
  restaurant: initialRestaurant,
  isOpen,
  onClose,
  userLocation,
}: RestaurantDetailsProps) {
  const [details, setDetails] = useState<Restaurant | null>(initialRestaurant);
  const [loading, setLoading] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null,
  );
  const { getPlaceDetails } = usePlaces();

  useEffect(() => {
    if (isOpen && initialRestaurant?.id) {
      setLoading(true);
      // Fetch full details including photos, reviews, website etc.
      getPlaceDetails(initialRestaurant.id)
        .then((fullDetails) => {
          if (fullDetails) {
            // Merge with initial detail to keep computed fields like distance if needed,
            // though getPlaceDetails re-returns most info.
            // We want to preserve 'distance' which we calculated in page.tsx
            setDetails((prev) => ({
              ...fullDetails,
              distance: prev?.distance || initialRestaurant.distance,
            }));
          }
        })
        .catch((err) => {
          console.error("Failed to fetch details:", err);
          // Fallback to initial restaurant data if fetch fails
          setDetails(initialRestaurant);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetails(initialRestaurant);
    }
  }, [isOpen, initialRestaurant, getPlaceDetails]);

  if (!details) return null;

  const isOpenNow = isRestaurantOpen(details.openingHours);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${details.location.lat},${details.location.lng}`;
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    const shareUrl = details.url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: details.name,
          text: `Check out ${details.name} on Eat What!`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(details.address);
    toast.success("Address copied to clipboard");
  };

  const formatReviewCount = (count?: number) => {
    if (!count) return "";
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  const handleNextImage = () => {
    if (currentImageIndex !== null && details?.photos) {
      setCurrentImageIndex((currentImageIndex + 1) % details.photos.length);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex !== null && details?.photos) {
      setCurrentImageIndex(
        (currentImageIndex - 1 + details.photos.length) % details.photos.length,
      );
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-screen sm:w-[450px] p-0 border-l sm:max-w-[450px] gap-0 flex flex-col z-110 [&>button]:hidden"
        >
          {/* Header Image Section */}
          <div className="relative h-64 w-full shrink-0 bg-muted">
            {details.photos && details.photos.length > 0 ? (
              <Image
                src={details.photos[0]}
                alt={details.name}
                fill
                className="object-cover"
              />
            ) : details.photoUrl ? (
              <Image
                src={details.photoUrl}
                alt={details.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-orange-400 to-red-500">
                <span className="text-6xl">🍽️</span>
              </div>
            )}

            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full shadow-md bg-white/90 hover:bg-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 h-full overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {details.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="font-semibold text-orange-600">
                    {details.rating}
                  </span>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.round(details.rating)
                            ? "fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    ({formatReviewCount(details.userRatingsTotal)})
                  </span>
                  <span>•</span>
                  <span className="text-green-700 font-medium">
                    {details.priceRange}
                  </span>
                  <span>•</span>
                  <span>{details.cuisine[0]}</span>
                </div>

                {/* Quick Tags */}
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  {details.dineIn && (
                    <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md">
                      <Utensils className="h-3 w-3" />
                      <span>Dine-in</span>
                    </div>
                  )}
                  {details.takeout && (
                    <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                      <ShoppingBag className="h-3 w-3" />
                      <span>Takeaway</span>
                    </div>
                  )}
                  {details.delivery && (
                    <div className="flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
                      <Car className="h-3 w-3" />
                      <span>Delivery</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 border-b pb-6">
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-3 px-1 gap-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={handleGetDirections}
                >
                  <Navigation className="h-5 w-5" />
                  <span className="text-xs font-medium">Directions</span>
                </Button>
                <SaveButton
                  restaurantId={details.id}
                  restaurantName={details.name}
                  className="flex flex-col h-auto py-3 px-1 gap-1 hover:bg-gray-50 bg-white"
                />
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-3 px-1 gap-1 hover:bg-gray-50"
                  onClick={() =>
                    details.website && window.open(details.website, "_blank")
                  }
                  disabled={!details.website}
                >
                  <Globe className="h-5 w-5" />
                  <span className="text-xs font-medium">Website</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-3 px-1 gap-1 hover:bg-gray-50"
                  onClick={() =>
                    details.phoneNumber &&
                    (window.location.href = `tel:${details.phoneNumber}`)
                  }
                  disabled={!details.phoneNumber}
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-xs font-medium">Call</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-3 px-1 gap-1 hover:bg-gray-50"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs font-medium">Share</span>
                </Button>
              </div>

              {/* Location & Hours */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{details.address}</p>
                    {details.distance !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistance(details.distance)} away
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:opacity-70">
                        <span
                          className={`text-sm font-medium ${isOpenNow ? "text-green-600" : "text-red-600"}`}
                        >
                          {isOpenNow ? "Open Now" : "Closed"}
                        </span>
                        {details.openingHours &&
                          details.openingHours.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              • Closes{" "}
                              {details.openingHours.find(
                                (d) => d.day === new Date().getDay(),
                              )?.close || "N/A"}
                            </span>
                          )}
                        <ChevronDown
                          className={`h-4 w-4 ml-auto transition-transform ${hoursOpen ? "rotate-180" : ""}`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {loading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Loading
                            hours...
                          </div>
                        ) : details.weekdayText ? (
                          <div className="mt-2 space-y-1">
                            {details.weekdayText.map((text, i) => (
                              <p
                                key={i}
                                className={`text-xs ${text.includes(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]) ? "font-bold text-gray-900" : "text-gray-500"}`}
                              >
                                {text}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic mt-2">
                            Complete hours not available
                          </p>
                        )}
                      </CollapsibleContent>
                    </div>
                  </div>
                </Collapsible>
              </div>

              {/* Tabs: Photos, Reviews, Menu(placeholder) */}
              <div className="pt-2">
                <Tabs defaultValue="photos">
                  <TabsList className="w-full">
                    <TabsTrigger value="photos" className="flex-1">
                      Photos
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex-1">
                      About
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="photos" className="mt-4">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    ) : details.photos && details.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {details.photos.map((photo, i) => (
                          <div
                            key={i}
                            className={`relative rounded-md overflow-hidden bg-muted cursor-pointer ${i === 0 ? "col-span-2 h-48" : "h-32"}`}
                            onClick={() => setCurrentImageIndex(i)}
                          >
                            <Image
                              src={photo}
                              alt={`${details.name} photo ${i + 1}`}
                              fill
                              className="object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No photos available
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-4 space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    ) : details.reviews && details.reviews.length > 0 ? (
                      details.reviews.map((review, i) => (
                        <div key={i} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden relative">
                              {review.profile_photo_url && (
                                <Image
                                  src={review.profile_photo_url}
                                  alt={review.author_name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {review.author_name}
                              </p>
                              <div className="flex items-center gap-1">
                                <div className="flex text-yellow-500">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-2.5 w-2.5 ${i < review.rating ? "fill-current" : "text-gray-300"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {review.relative_time_description}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-4">
                            {review.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No reviews yet
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="about" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Cuisines</h4>
                        <div className="flex flex-wrap gap-1">
                          {details.cuisine.map((c) => (
                            <Badge key={c} variant="outline">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {details.website && (
                        <div>
                          <h4 className="font-medium mb-1">Website</h4>
                          <a
                            href={details.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline flex items-center gap-1"
                          >
                            {new URL(details.website).hostname}{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {details.url && (
                        <div>
                          <h4 className="font-medium mb-1">Google Maps</h4>
                          <a
                            href={details.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline flex items-center gap-1"
                          >
                            View on Google Maps{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>

          {/* Footer actions often shown in mobile apps, but we have them in the grid above. 
            We can add a 'Order Online' button if we had a link. 
        */}
        </SheetContent>
      </Sheet>

      {/* Image Lightbox - Outside Sheet for proper z-index */}
      {currentImageIndex !== null && details?.photos && (
        <div
          className="fixed inset-0 bg-black/95 z-9999 flex items-center justify-center"
          onClick={() => setCurrentImageIndex(null)}
          style={{ pointerEvents: "auto" }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-10"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(null);
            }}
          >
            <X className="h-6 w-6" />
          </Button>

          {details.photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12 z-10"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePrevImage();
                }}
              >
                <ChevronDown className="h-8 w-8 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12 z-10"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNextImage();
                }}
              >
                <ChevronDown className="h-8 w-8 -rotate-90" />
              </Button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-6xl max-h-[90vh] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={details.photos[currentImageIndex]}
              alt={`${details.name} photo ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full z-10">
            {currentImageIndex + 1} / {details.photos.length}
          </div>
        </div>
      )}
    </>
  );
}
