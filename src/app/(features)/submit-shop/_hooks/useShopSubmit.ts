import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { ShopPayload } from "@/app/(features)/_lib/types";
import { googleTypeToJapaneseMap } from "@/lib/googleMapsTypes";
import type { Json } from "@/lib/database.types";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface ShopFormValues {
  name: string;
  addressInput: string;
  photo: File | null;
  url: string;
  selectedCategories: string[];
  detailedCategory: string;
  comments: string;
  placeId: string | null;
  autoPhotoUrl: string | null;
  rating: number | null;
  businessHours: { day: string; time: string }[] | null;
  latitude: number | null;
  longitude: number | null;
}

export const useShopSubmit = (user: User) => {
  const { supabase } = useAuth(); // Use supabase from useAuth
  const router = useRouter();

  const form = useForm<ShopFormValues>({
    defaultValues: {
      name: "",
      addressInput: "",
      photo: null,
      url: "",
      selectedCategories: [],
      detailedCategory: "",
      comments: "",
      placeId: null,
      autoPhotoUrl: null,
      rating: null,
      businessHours: null,
      latitude: null,
      longitude: null,
    },
  });

  const { watch, setValue, handleSubmit, formState: { isSubmitting } } = form;

  const name = watch("name");
  const addressInput = watch("addressInput");
  const photo = watch("photo");
  const url = watch("url");
  const selectedCategories = watch("selectedCategories");
  const detailedCategory = watch("detailedCategory");
  const comments = watch("comments");
  const placeId = watch("placeId");
  const autoPhotoUrl = watch("autoPhotoUrl");
  const rating = watch("rating");
  const businessHours = watch("businessHours");
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
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
    setValue("name", suggestion.structured_formatting.main_text);
    setValue("addressInput", suggestion.structured_formatting.secondary_text);
    setSuggestions([]);
    setValue("placeId", suggestion.place_id);

    try {
      const response = await fetch(
        `/api/placedetails?place_id=${suggestion.place_id}`
      );
      const data = await response.json();
      if (data) {
        setValue("name", data.name || suggestion.structured_formatting.main_text);
        setValue("latitude", data.latitude || null);
        setValue("longitude", data.longitude || null);
        setValue("autoPhotoUrl", data.photo_url_api || null);
        setValue("rating", data.rating || null);
        setValue("businessHours", data.business_hours_weekly || null);
        if (data.types && Array.isArray(data.types)) {
          const translatedCategories = data.types.map(
            (type: string) => googleTypeToJapaneseMap[type] || type
          );
          setValue("selectedCategories", translatedCategories);
        } else {
          setValue("selectedCategories", []);
        }
      }
    } catch (err) {
      console.error("Place details fetch error:", err);
      setValue("name", suggestion.structured_formatting.main_text);
    }
  };

  const onSubmit: SubmitHandler<ShopFormValues> = async (values) => {
    setError(null);
    try {
      let finalPhotoUrl: string | null = null;
      if (values.photo) {
        const fileExt = values.photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, values.photo);
        if (uploadError)
          throw new Error(`写真のアップロードに失敗: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage
          .from("shop-photos")
          .getPublicUrl(uploadData.path);
        finalPhotoUrl = publicUrlData.publicUrl;
      } else if (values.autoPhotoUrl) {
        finalPhotoUrl = values.autoPhotoUrl;
      }

      let finalLatitude = values.latitude;
      let finalLongitude = values.longitude;
      if ((!finalLatitude || !finalLongitude) && values.addressInput) {
        try {
          const geocodeResponse = await fetch(
            `/api/geocode?address=${encodeURIComponent(values.addressInput)}`
          );
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            finalLatitude = geocodeData.latitude;
            finalLongitude = geocodeData.longitude;
            if (geocodeData.formatted_address) {
              setValue("addressInput", geocodeData.formatted_address);
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
          const walkTimeResponse = await fetch(
            `/api/walk-time?lat=${finalLatitude}&lng=${finalLongitude}`
          );
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
        name: values.name,
        user_id: user.id,
        photo_url: finalPhotoUrl,
        url: values.url || null,
        business_hours_weekly: values.businessHours as unknown as Json,
        rating: values.rating,
        location: values.addressInput || null,
        latitude: finalLatitude,
        longitude: finalLongitude,
        category: values.selectedCategories.length > 0 ? values.selectedCategories : null,
        detailed_category: values.detailedCategory || values.selectedCategories.join(","),
        comments: values.comments || null,
        nearest_station_name: nearestStationName,
        walk_time_from_station: walkTimeFromStation,
        place_id: values.placeId,
      };

      const { error: insertError } = await supabase
        .from("shops")
        .insert(shopPayload);
      if (insertError)
        throw new Error(`投稿の保存に失敗: ${insertError.message}`);

      alert("投稿が完了しました！");
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "投稿中にエラーが発生しました。";
      setError(message);
    }
  };

  return {
    form,
    name,
    addressInput,
    suggestions,
    photo,
    url,
    selectedCategories,
    detailedCategory,
    comments,
    autoPhotoUrl,
    rating,
    businessHours,
    isSubmitting,
    error,
    handleSuggestionSelect,
    handleSubmit: handleSubmit(onSubmit),
  };
};
