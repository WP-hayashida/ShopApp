import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ShopPayload } from "@/app/(features)/_lib/types";
import { googleTypeToJapaneseMap } from "@/lib/googleMapsTypes";
import type { Json } from "@/lib/database.types";

interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export const useShopSubmit = (user: User) => {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [name, setName] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [detailedCategory, setDetailedCategory] = useState("");
  const [comments, setComments] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [autoPhotoUrl, setAutoPhotoUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [businessHours, setBusinessHours] = useState<{ day: string; time: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (name.length < 2) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(`/api/autocomplete?input=${name}`);
        const data = await response.json();
        setSuggestions(data.predictions || []);
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [name]);

  const handleSuggestionSelect = async (suggestion: AutocompletePrediction) => {
    setName(suggestion.structured_formatting.main_text);
    setAddressInput(suggestion.structured_formatting.secondary_text);
    setSuggestions([]);
    setPlaceId(suggestion.place_id);

    try {
      const response = await fetch(`/api/placedetails?place_id=${suggestion.place_id}`);
      const data = await response.json();
      if (data) {
        setName(data.name || suggestion.structured_formatting.main_text);
        setLatitude(data.latitude || null);
        setLongitude(data.longitude || null);
        setAutoPhotoUrl(data.photo_url_api || null);
        setRating(data.rating || null);
        setBusinessHours(data.business_hours_weekly || null);
        if (data.types && Array.isArray(data.types)) {
          const translatedCategories = data.types.map(
            (type: string) => googleTypeToJapaneseMap[type] || type
          );
          setSelectedCategories(translatedCategories);
        } else {
          setSelectedCategories([]);
        }
      }
    } catch (err) {
      console.error("Place details fetch error:", err);
      setName(suggestion.structured_formatting.main_text);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let finalPhotoUrl: string | null = null;
      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, photo);
        if (uploadError) throw new Error(`写真のアップロードに失敗: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage
          .from("shop-photos")
          .getPublicUrl(uploadData.path);
        finalPhotoUrl = publicUrlData.publicUrl;
      } else if (autoPhotoUrl) {
        finalPhotoUrl = autoPhotoUrl;
      }

      let finalLatitude = latitude;
      let finalLongitude = longitude;
      if ((!finalLatitude || !finalLongitude) && addressInput) {
        try {
          const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(addressInput)}`);
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            finalLatitude = geocodeData.latitude;
            finalLongitude = geocodeData.longitude;
            if (geocodeData.formatted_address) {
              setAddressInput(geocodeData.formatted_address);
            }
          }
        } catch (geoError) {
          console.error("Error during geocoding:", geoError);
        }
      }

      let nearestStationName: string | null = null;
      let walkTimeFromStation: number | null = null;
      if (finalLatitude && finalLongitude) {
        try {
          const walkTimeResponse = await fetch(`/api/walk-time?lat=${finalLatitude}&lng=${finalLongitude}`);
          if (walkTimeResponse.ok) {
            const walkTimeData = await walkTimeResponse.json();
            nearestStationName = walkTimeData.stationName;
            walkTimeFromStation = walkTimeData.walkTime;
          }
        } catch (walkError) {
          console.error("Error fetching walking time:", walkError);
        }
      }

      const shopPayload: ShopPayload = {
        name,
        user_id: user.id,
        photo_url: finalPhotoUrl,
        url: url || null,
        business_hours_weekly: businessHours as unknown as Json,
        rating: rating,
        location: addressInput || null,
        latitude: finalLatitude,
        longitude: finalLongitude,
        category: selectedCategories.length > 0 ? selectedCategories : null,
        detailed_category: detailedCategory || null,
        comments: comments || null,
        nearest_station_name: nearestStationName,
        walk_time_from_station: walkTimeFromStation,
        place_id: placeId,
      };

      const { error: insertError } = await supabase.from("shops").insert(shopPayload);
      if (insertError) throw new Error(`投稿の保存に失敗: ${insertError.message}`);
      
      alert("投稿が完了しました！");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "投稿中にエラーが発生しました。";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    name, setName,
    addressInput, setAddressInput,
    suggestions,
    photo, setPhoto,
    url, setUrl,
    selectedCategories,
    detailedCategory, setDetailedCategory,
    comments, setComments,
    autoPhotoUrl,
    rating,
    businessHours,
    loading,
    error,
    handleSuggestionSelect,
    handleSubmit,
  };
};