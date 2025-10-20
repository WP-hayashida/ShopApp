"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Tag } from "lucide-react";
import { googleTypeToJapaneseMap } from "@/lib/googleMapsTypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { APIProvider } from "@vis.gl/react-google-maps"; // Needed for APIProvider

const sortOptions = [
  { value: "created_at.desc", label: "新着順" },
  { value: "created_at.asc", label: "古い順" },
  { value: "likes.desc", label: "いいね順" },
];

const categoryOptions = Object.entries(googleTypeToJapaneseMap).map(
  ([value, label]) => ({
    value,
    label,
  })
);

const radiusOptions = [
  { value: 1000, label: "1km以内" },
  { value: 2000, label: "2km以内" },
  { value: 5000, label: "5km以内" },
  { value: 10000, label: "10km以内" },
  { value: null, label: "指定なし" }, // Option to clear radius
];

import { SearchFilters } from "../_lib/types";

interface SearchControlsProps {
  initialFilters: SearchFilters;
  onSearch: (filters: SearchFilters) => void;
}

interface AutocompletePrediction {
  description: string;
  place_id: string;
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  initialFilters,
  onSearch,
}) => {
  const [localKeywordGeneral, setLocalKeywordGeneral] = useState(
    initialFilters.keyword_general
  );
  const [localKeywordLocation, setLocalKeywordLocation] = useState(
    initialFilters.keyword_location
  );
  const [localSearchLat, setLocalSearchLat] = useState(
    initialFilters.search_lat
  );
  const [localSearchLng, setLocalSearchLng] = useState(
    initialFilters.search_lng
  );
  const [localSearchRadius, setLocalSearchRadius] = useState(
    initialFilters.search_radius
  );
  const [localSortBy, setLocalSortBy] = useState(initialFilters.sortBy);
  const [localCategories, setLocalCategories] = useState<string[]>(
    initialFilters.category || []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Sync local filters with initialFilters (from context/parent)
  useEffect(() => {
    setLocalKeywordGeneral(initialFilters.keyword_general);
    setLocalKeywordLocation(initialFilters.keyword_location);
    setLocalSearchLat(initialFilters.search_lat);
    setLocalSearchLng(initialFilters.search_lng);
    setLocalSearchRadius(initialFilters.search_radius);
    setLocalSortBy(initialFilters.sortBy);
    setLocalCategories(initialFilters.category || []);
  }, [initialFilters]);

  // Autocomplete logic
  useEffect(() => {
    if (!localKeywordLocation || localKeywordLocation.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/autocomplete?input=${localKeywordLocation || ""}`
        );
        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
          setSuggestions(data.predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localKeywordLocation]);

  const handleCategoryChange = (category: string, isChecked: boolean) => {
    setLocalCategories((prevCategories) => {
      const newCategories = isChecked
        ? [...prevCategories, category]
        : prevCategories.filter((c) => c !== category);
      return newCategories;
    });
  };

  const handleSuggestionSelect = async (suggestion: AutocompletePrediction) => {
    setLocalKeywordLocation(suggestion.description); // Set text for display
    setSuggestions([]);
    setShowSuggestions(false);

    // Fetch coordinates for the selected place
    try {
      const response = await fetch(
        `/placedetails?placeId=${suggestion.place_id}`
      );
      const data = await response.json();
      if (data.place && data.place.location) {
        setLocalSearchLat(data.place.location.latitude);
        setLocalSearchLng(data.place.location.longitude);
        setLocalSearchRadius(2000); // Default search radius: 2km
      } else {
        setLocalSearchLat(null);
        setLocalSearchLng(null);
        setLocalSearchRadius(null);
      }
    } catch (err) {
      console.error("Place details fetch error:", err);
      setLocalSearchLat(null);
      setLocalSearchLng(null);
      setLocalSearchRadius(null);
    }
  };

  const handleApply = async () => {
    setGeocodingError(null);
    setGeocodingLoading(true);

    let finalLat = localSearchLat;
    let finalLng = localSearchLng;
    let finalRadius = localSearchRadius;

    if (
      localKeywordLocation &&
      (localSearchLat === null || localSearchLng === null)
    ) {
      try {
        const response = await fetch(
          `/api/geocode?address=${encodeURIComponent(localKeywordLocation)}`
        );
        const data = await response.json();

        if (response.ok && data.latitude && data.longitude) {
          finalLat = data.latitude;
          finalLng = data.longitude;
          finalRadius = finalRadius === null ? 2000.0 : finalRadius;
        } else {
          console.warn("Geocoding failed for location text.");
        }
      } catch (err) {
        console.error("Geocoding API error:", err);
      }
    }
    setGeocodingLoading(false);

    onSearch({
      keyword_general: localKeywordGeneral,
      keyword_location: localKeywordLocation,
      search_lat: finalLat,
      search_lng: finalLng,
      search_radius: finalRadius,
      location_text: localKeywordLocation, // Keep original text for display
      category: localCategories,
      sortBy: localSortBy,
    });
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    setLocalKeywordGeneral("");
    setLocalKeywordLocation("");
    setLocalSearchLat(null);
    setLocalSearchLng(null);
    setLocalSearchRadius(null);
    setLocalSortBy("created_at.desc");
    setLocalCategories([]);
    onSearch({
      keyword_general: "",
      keyword_location: "",
      search_lat: null,
      search_lng: null,
      search_radius: null,
      location_text: "",
      category: [],
      sortBy: "created_at.desc",
    });
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="text-center py-10">
        Google Maps APIキーが設定されていません。
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>検索・絞り込み</DialogTitle>
            <DialogDescription>お店を検索・絞り込みます。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* キーワード入力 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="keyword" className="text-right">
                キーワード
              </Label>
              <Input
                id="keyword"
                value={localKeywordGeneral}
                onChange={(e) => setLocalKeywordGeneral(e.target.value)}
                placeholder="店名、カテゴリなど"
                className="col-span-3"
              />
            </div>
            {/* 場所入力 (オートコンプリート & Geocoding) */}
            <div className="grid grid-cols-4 items-center gap-4 relative">
              <Label htmlFor="location" className="text-right">
                場所
              </Label>
              <div className="col-span-3">
                <Input
                  id="location"
                  value={localKeywordLocation}
                  onChange={(e) => setLocalKeywordLocation(e.target.value)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  placeholder="住所、駅名など"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <Command className="absolute z-50 w-[calc(75%-0.5rem)] right-0 bg-background border rounded-md mt-1 shadow-lg">
                    <CommandList>
                      {suggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion.place_id}
                          onMouseDown={(e) => e.preventDefault()} // Prevent onBlur from firing
                          onSelect={() => handleSuggestionSelect(suggestion)}
                        >
                          {suggestion.description}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                )}
                {geocodingLoading && (
                  <p className="text-sm text-muted-foreground mt-1">
                    場所を検索中...
                  </p>
                )}
                {geocodingError && (
                  <p className="text-sm text-red-500 mt-1">{geocodingError}</p>
                )}
              </div>
            </div>
            {/* 検索半径選択 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="searchRadius" className="text-right">
                検索半径
              </Label>
              <Select
                value={
                  localSearchRadius !== null
                    ? String(localSearchRadius)
                    : "null"
                }
                onValueChange={(value) =>
                  setLocalSearchRadius(value === "null" ? null : Number(value))
                }
              >
                <SelectTrigger id="searchRadius" className="col-span-3">
                  <SelectValue placeholder="検索半径を選択" />
                </SelectTrigger>
                <SelectContent>
                  {radiusOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* カテゴリ選択 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                カテゴリ
              </Label>
              <Popover
                modal={true}
                open={categoryPopoverOpen}
                onOpenChange={setCategoryPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryPopoverOpen}
                    className="col-span-3 justify-between"
                  >
                    <span className="truncate">
                      {localCategories.length > 0
                        ? localCategories.join(", ")
                        : "カテゴリを選択"}
                    </span>
                    <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="カテゴリを検索..." />
                    <CommandList className="max-h-52 overflow-y-auto">
                      <CommandEmpty>カテゴリが見つかりません。</CommandEmpty>
                      <CommandGroup>
                        {categoryOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={() => {
                              handleCategoryChange(
                                option.label,
                                !localCategories.includes(option.label)
                              );
                            }}
                          >
                            <Checkbox
                              checked={localCategories.includes(option.label)}
                              className="mr-2"
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* 並び順選択 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sortBy" className="text-right">
                並び順
              </Label>
              <Select
                value={localSortBy}
                onValueChange={(value) => setLocalSortBy(value)}
              >
                <SelectTrigger id="sortBy" className="col-span-3">
                  <SelectValue placeholder="並び順を選択" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReset} variant="outline">
              リセット
            </Button>
            <Button onClick={handleApply}>検索</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </APIProvider>
  );
};
