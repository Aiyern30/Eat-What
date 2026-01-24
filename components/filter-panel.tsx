"use client";

import {
  FilterState,
  CuisineType,
  PriceRange,
  DietaryOption,
} from "@/types/restaurant";
import {
  AREAS,
  CUISINE_TYPES,
  PRICE_RANGES,
  DIETARY_OPTIONS,
} from "@/data/restaurants";
import { MultiSelect } from "@/components/multi-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, RefreshCw, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isMobile?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function FilterPanel({
  filters,
  onFilterChange,
  isMobile = false,
  onRefresh,
  isRefreshing = false,
}: FilterPanelProps) {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      areas: [],
      distance: 15,
      cuisines: [],
      dietary: [],
      priceRange: [],
      minRating: 0,
      openNow: false,
      resultLimit: 50,
    });
  };

  const activeFilterCount =
    filters.areas.length +
    filters.cuisines.length +
    filters.dietary.length +
    filters.priceRange.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.openNow ? 1 : 0);

  const filterContent = (
    <div className="space-y-6">
      {/* Area Filter */}
      <div className="space-y-2">
        <Label>Areas</Label>
        <MultiSelect
          options={AREAS}
          selected={filters.areas}
          onChange={(areas) => updateFilter("areas", areas)}
          placeholder="Select areas..."
          emptyText="No areas found."
        />
      </div>

      {/* Distance Filter */}
      <div className="space-y-2">
        <Label>Distance: {filters.distance}km</Label>
        <Slider
          value={[filters.distance]}
          onValueChange={([value]) => updateFilter("distance", value)}
          max={15}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1km</span>
          <span>15km</span>
        </div>
      </div>

      {/* Result Limit Filter */}
      <div className="space-y-2">
        <Label>Show Results: {filters.resultLimit}</Label>
        <Slider
          value={[filters.resultLimit]}
          onValueChange={([value]) => updateFilter("resultLimit", value)}
          max={50}
          min={20}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>20</span>
          <span>50</span>
        </div>
      </div>

      {/* Cuisine Type Filter */}
      <div className="space-y-2">
        <Label>Cuisine Types</Label>
        <MultiSelect
          options={CUISINE_TYPES}
          selected={filters.cuisines}
          onChange={(cuisines) =>
            updateFilter("cuisines", cuisines as CuisineType[])
          }
          placeholder="Select cuisines..."
          emptyText="No cuisines found."
        />
      </div>

      {/* Dietary Options Filter */}
      <div className="space-y-2">
        <Label>Dietary Options</Label>
        <MultiSelect
          options={DIETARY_OPTIONS}
          selected={filters.dietary}
          onChange={(dietary) =>
            updateFilter("dietary", dietary as DietaryOption[])
          }
          placeholder="Select dietary options..."
          emptyText="No options found."
        />
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="flex gap-2">
          {PRICE_RANGES.map((price) => (
            <Button
              key={price}
              variant={
                filters.priceRange.includes(price) ? "default" : "outline"
              }
              size="sm"
              onClick={() => {
                const newPrices = filters.priceRange.includes(price)
                  ? filters.priceRange.filter((p) => p !== price)
                  : [...filters.priceRange, price];
                updateFilter("priceRange", newPrices as PriceRange[]);
              }}
              className="flex-1"
            >
              {price}
            </Button>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2">
        <Label>Minimum Rating</Label>
        <Select
          value={filters.minRating.toString()}
          onValueChange={(value) =>
            updateFilter("minRating", parseFloat(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any rating</SelectItem>
            <SelectItem value="3">3+ stars</SelectItem>
            <SelectItem value="3.5">3.5+ stars</SelectItem>
            <SelectItem value="4">4+ stars</SelectItem>
            <SelectItem value="4.5">4.5+ stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Open Now Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="open-now">Open Now</Label>
        <Switch
          id="open-now"
          checked={filters.openNow}
          onCheckedChange={(checked) => updateFilter("openNow", checked)}
        />
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="default"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh List
            </>
          )}
        </Button>
      )}

      {/* Reset Button */}
      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={resetFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Reset Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-75 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{filterContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold">Filters</h2>
      {filterContent}
    </div>
  );
}
