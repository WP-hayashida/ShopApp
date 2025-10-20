"use client";

import React, { useState, useEffect } from "react";
import { StoreDetail } from "@/components/StoreDetail";
import { createClient } from "@/lib/supabase/client";
import { Shop } from "../../_lib/types";
import { useParams, useRouter } from "next/navigation";
import { SupabaseClient, User } from "@supabase/supabase-js"; // Import SupabaseClient type
import { Database } from "@/lib/database.types";

interface BusinessHours {
  day: string;
  time: string;
}

type ShopTableRow = Database["public"]["Tables"]["shops"]["Row"];

interface InitialShopData extends ShopTableRow {
  likes: { user_id: string }[];
  ratings: { rating: number | null }[];
  reviews: { id: string }[];
}

interface EnrichedShopData {
  place_id: string | null;
  name: string;
  price_range?: string | null;
  business_hours_weekly?: BusinessHours[] | null;
  rating?: number | null;
  phone_number?: string | null;
  photo_url_api?: string | null;
  api_last_updated: string | null;
  types?: string[] | null;
}

export default function ShopDetailPage() {
  // useParamsフックを使ってURLパラメータを取得
  const params = useParams();
  // params.idはstring | string[]型なので、stringとして扱う
  const shopId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [store, setStore] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = () => {
      const client = createClient();
      setSupabase(client);
    };
    initSupabase();
  }, []);

  const handleNavigateBack = () => {
    router.back();
  };

  const handleLikeToggle = async (shopId: string, newLikedStatus: boolean) => {
    if (!currentUserId || !supabase) {
      // Check if supabase is initialized
      alert("いいねするにはログインしてください。");
      return;
    }

    // Optimistically update the UI
    setStore((prevStore) => {
      if (!prevStore) return null;
      return {
        ...prevStore,
        likes: newLikedStatus ? prevStore.likes + 1 : prevStore.likes - 1,
        liked: newLikedStatus,
      };
    });

    if (newLikedStatus) {
      // いいねする
      const { error } = await supabase.from("likes").insert({
        user_id: currentUserId,
        shop_id: shopId,
      });
      if (error) {
        if (error.code === "23505") {
          // Duplicate key error
          console.warn("User already liked this shop.");
        } else {
          console.error("Error liking shop:", error);
        }
        // Revert optimistic update if there's an error
        setStore((prevStore) => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            likes: newLikedStatus ? prevStore.likes - 1 : prevStore.likes + 1,
            liked: !newLikedStatus,
          };
        });
      }
    } else {
      // いいねを取り消す
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("shop_id", shopId);
      if (error) {
        console.error("Error unliking shop:", error);
        // Revert optimistic update if there's an error
        setStore((prevStore) => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            likes: newLikedStatus ? prevStore.likes - 1 : prevStore.likes + 1,
            liked: !newLikedStatus,
          };
        });
      }
    }
  };

  useEffect(() => {
    if (!supabase) return; // Only run if supabase client is initialized

    const fetchAndSetShop = async () => {
      if (!shopId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;
      setCurrentUserId(currentUserId || null); // Update the state here

      // First, fetch basic shop data from Supabase to get place_id
      const { data, error: initialShopError } = await supabase
        .from("shops")
        .select(
          `
          id, name, photo_url, url, business_hours, location, latitude, longitude, category, detailed_category, comments, user_id, searchable_categories_text, place_id,
          likes(user_id),
          ratings(rating),
          reviews(id)
        `
        )
        .eq("id", shopId)
        .single();

      const initialShopData = data as InitialShopData | null;

      if (initialShopError) {
        console.error("Error fetching initial shop data:", initialShopError);
        setLoading(false);
        return;
      }

      if (!initialShopData || !initialShopData.place_id) {
        console.error("Shop not found or place_id is missing.");
        setLoading(false);
        return;
      }

      // Now, fetch enriched data from our /api/placedetails route using place_id
      let enrichedShopData: Partial<EnrichedShopData> = {};
      try {
        const apiResponse = await fetch(
          `/api/placedetails?place_id=${initialShopData.place_id}`
        );
        if (apiResponse.ok) {
          enrichedShopData = await apiResponse.json();
        } else {
          console.error(
            "Error fetching enriched shop data:",
            await apiResponse.text()
          );
        }
      } catch (apiError) {
        console.error("Network error fetching enriched shop data:", apiError);
      }

      // Merge initial Supabase data with enriched API data
      const mergedShopData = { ...initialShopData, ...enrichedShopData };

      if (mergedShopData) {
        let profile = null;
        if (mergedShopData.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", mergedShopData.user_id)
            .single();
          if (profileError) {
            console.error(
              "Error fetching profile data for user_id:",
              mergedShopData.user_id,
              profileError
            );
          } else {
            profile = profileData;
          }
        }

        const shopLikes = mergedShopData.likes || [];
        const shopRatings = mergedShopData.ratings || [];
        const shopReviews = mergedShopData.reviews || [];

        const totalRating = shopRatings.reduce(
          (sum: number, r: { rating: number | null }) => sum + (r.rating || 0),
          0
        );
        const averageRating =
          shopRatings.length > 0 ? totalRating / shopRatings.length : 0;

        const transformedShop: Shop = {
          id: mergedShopData.id,
          name: mergedShopData.name,
          imageUrl:
            mergedShopData.photo_url_api ||
            mergedShopData.photo_url ||
            "/next.svg", // Prioritize API photo
          url: mergedShopData.url || "",
          hours: mergedShopData.business_hours || "N/A", // This will be replaced by business_hours_weekly
          location: mergedShopData.location || "",
          latitude: mergedShopData.latitude ?? null,
          longitude: mergedShopData.longitude ?? null,
          category: mergedShopData.category || [], // Default to empty array
          detailed_category: mergedShopData.detailed_category || "",
          description: mergedShopData.comments || "説明がありません。",
          tags: mergedShopData.detailed_category
            ? mergedShopData.detailed_category
                .split(",")
                .map((tag: string) => tag.trim())
            : [],
          user: {
            id: profile?.id || mergedShopData.user_id!,
            username: profile?.username || "unknown_user",
            avatar_url:
              profile?.avatar_url || "https://i.pravatar.cc/64?u=unknown",
          },
          likes: shopLikes.length,
          liked: currentUserId
            ? shopLikes.some(
                (like: { user_id: string }) => like.user_id === currentUserId
              )
            : false,
          rating: mergedShopData.rating ?? parseFloat(averageRating.toFixed(1)), // Prioritize API rating
          reviewCount: shopReviews.length,
          searchable_categories_text:
            mergedShopData.searchable_categories_text ?? null,
          place_id: mergedShopData.place_id ?? null,
          formatted_address: mergedShopData.formatted_address ?? null,
          nearest_station_name: mergedShopData.nearest_station_name ?? null,
          nearest_station_place_id:
            mergedShopData.nearest_station_place_id ?? null,
          walk_time_from_station: mergedShopData.walk_time_from_station ?? null,
          // New fields from API
          price_range: mergedShopData.price_range,
          business_hours_weekly:
            mergedShopData.business_hours_weekly as unknown as
              | BusinessHours[]
              | null,
          phone_number: mergedShopData.phone_number,
          photo_url_api: mergedShopData.photo_url_api,
          api_last_updated: mergedShopData.api_last_updated,
        };
        setStore(transformedShop);
      }

      setLoading(false);
    };

    fetchAndSetShop();
  }, [supabase, shopId]);

  if (loading) {
    return <div className="text-center py-16">読み込み中...</div>;
  }

  if (!store) {
    return (
      <div className="text-center py-16">お店が見つかりませんでした。</div>
    );
  }

  return (
    <StoreDetail
      store={store}
      onNavigate={handleNavigateBack}
      onLikeToggle={handleLikeToggle}
    />
  );
}
