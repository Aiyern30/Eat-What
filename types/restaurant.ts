export type CuisineType =
  | "Chinese"
  | "Malay"
  | "Indian"
  | "Western"
  | "Japanese"
  | "Korean"
  | "Thai"
  | "Hot Pot"
  | "BBQ"
  | "Buffet"
  | "Fast Food"
  | "Cafe"
  | "Bakery"

export type PriceRange = "$" | "$$" | "$$$"

export type DietaryOption = "Halal" | "Vegetarian" | "Vegan"

export interface Location {
  lat: number
  lng: number
}

export interface OpeningHours {
  day: number // 0-6 (Sunday-Saturday)
  open: string // "HH:MM"
  close: string // "HH:MM"
}

export interface Restaurant {
  id: string
  name: string
  cuisine: CuisineType[]
  rating: number
  priceRange: PriceRange
  location: Location
  address: string
  area: string
  phoneNumber?: string
  photoUrl?: string
  dietaryOptions: DietaryOption[]
  openingHours?: OpeningHours[]
  distance?: number // Will be calculated based on user location
}

export interface FilterState {
  areas: string[]
  distance: number // in kilometers
  cuisines: CuisineType[]
  dietary: DietaryOption[]
  priceRange: PriceRange[]
  minRating: number
  openNow: boolean
}

export interface UserLocation {
  coords: Location
  address?: string
}
