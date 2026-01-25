export type CuisineType =
  | "Chinese"
  | "Malay"
  | "Indian"
  | "Western"
  | "Japanese"
  | "Korean"
  | "Thai"
  | "Vietnamese"
  | "Mexican"
  | "Italian"
  | "Asian"
  | "Hot Pot"
  | "BBQ"
  | "Buffet"
  | "Fast Food"
  | "Cafe"
  | "Bakery";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type DietaryOption = "Halal" | "Vegetarian" | "Vegan";

export interface Location {
  lat: number;
  lng: number;
}

export interface OpeningHours {
  day: number; // 0-6 (Sunday-Saturday)
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface Review {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  profile_photo_url: string;
  time: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: CuisineType[];
  rating: number;
  priceRange: PriceRange;
  priceLevel?: number; // 1-4 scale from Google Places
  location: Location;
  address: string;
  area: string;
  phoneNumber?: string;
  photoUrl?: string; // Main photo
  photos?: string[]; // All photo URLs
  dietaryOptions: DietaryOption[];
  openingHours?: OpeningHours[];
  weekdayText?: string[]; // Full text opening hours
  distance?: number; // Will be calculated based on user location
  isOpen?: boolean; // Current open status from Google Places
  userRatingsTotal?: number;
  dineIn?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  website?: string;
  reviews?: Review[];
  url?: string; // Google Maps URL
}

export interface FilterState {
  areas: string[];
  distance: number; // in kilometers
  cuisines: CuisineType[];
  dietary: DietaryOption[];
  priceRange: PriceRange[];
  minRating: number;
  openNow: boolean;
  resultLimit: number; // 20-50 restaurants
}

export interface UserLocation {
  coords: Location;
  address?: string;
}
