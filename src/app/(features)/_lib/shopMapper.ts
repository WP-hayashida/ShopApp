import { Shop, User, RpcShopReturnType } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";

// Supabaseから取得した生のショップデータの型定義
export interface RawSupabaseShop {
  id: string;
  created_at: string;
  name: string;
  photo_url: string | null;
  url: string | null;
  business_hours: string | null;
  location: string | null;
  category: string[] | null;
  detailed_category: string | null;
  comments: string | null;
  user_id: string | null;
  likes: { user_id: string }[];
  ratings: { rating: number | null }[];
  reviews: { id: string }[];
  searchable_categories_text: string | null;
  // --- Google Maps Platform 関連の追加フィールド ---
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  formatted_address?: string | null;
  nearest_station_name?: string | null;
  nearest_station_place_id?: string | null;
  walk_time_from_station?: number | null;
}

/**
 * RPC関数の戻り値をShop型にマッピングする
 * @param rpcShop - RPC関数`search_shops`から返されたショップデータ
 * @returns アプリケーションのShop型オブジェクト
 */
export const mapRpcShopToShop = (rpcShop: RpcShopReturnType): Shop => {
  return {
    id: rpcShop.id,
    name: rpcShop.name,
    imageUrl: rpcShop.photo_url_api || rpcShop.photo_url || "/next.svg",
    url: rpcShop.url || "",
    hours: rpcShop.business_hours || "N/A",
    location: rpcShop.location || "",
    category: rpcShop.category || [],
    detailed_category: rpcShop.detailed_category || "",
    description: rpcShop.comments || "説明がありません。",
    comments: rpcShop.comments,
    tags: rpcShop.tags || [],
    user: {
      id: rpcShop.user_id!,
      username: rpcShop.username || "unknown",
      avatar_url: rpcShop.avatar_url || null,
    },
    likes: rpcShop.like_count || 0,
    liked: rpcShop.liked || false,
    rating: rpcShop.rating || 0,
    reviewCount: rpcShop.review_count || 0,
    searchable_categories_text: rpcShop.searchable_categories_text ?? null,
    latitude: rpcShop.latitude ?? null,
    longitude: rpcShop.longitude ?? null,
    place_id: rpcShop.place_id ?? null,
    formatted_address: rpcShop.formatted_address ?? null,
    nearest_station_name: rpcShop.nearest_station_name ?? null,
    nearest_station_place_id: rpcShop.nearest_station_place_id ?? null,
    walk_time_from_station: rpcShop.walk_time_from_station ?? null,
    price_range: rpcShop.price_range ?? undefined,
    business_hours_weekly: rpcShop.business_hours_weekly
      ? (rpcShop.business_hours_weekly as any)
      : null,
    phone_number: rpcShop.phone_number ?? undefined,
    photo_url_api: rpcShop.photo_url_api ?? undefined,
    api_last_updated: rpcShop.api_last_updated ?? undefined,
  };
};

/**
 * Supabaseから取得した生のショップデータをアプリケーションのShop型にマッピングするヘルパー関数
 * @param rawShop - Supabaseから取得した生のショップデータ
 * @param supabase - Supabaseクライアントインスタンス
 * @param currentUserId - 現在ログインしているユーザーのID（いいね判定用）
 * @returns アプリケーションのShop型オブジェクト
 */
export async function mapSupabaseShopToShop(
  rawShop: RawSupabaseShop,
  supabase: SupabaseClient,
  currentUserId: string | null
): Promise<Shop> {
  let ownerUser: User | null = null;
  if (rawShop.user_id) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", rawShop.user_id)
      .maybeSingle();
    if (profileError) {
      console.error(
        "Error fetching profile data for user_id:",
        rawShop.user_id,
        profileError
      );
    } else {
      ownerUser = profileData as User;
    }
  }

  const shopLikes = rawShop.likes || [];
  const shopRatings = rawShop.ratings || [];
  const shopReviews = rawShop.reviews || [];

  const totalRating = shopRatings.reduce(
    (sum: number, r: { rating: number | null }) => sum + (r.rating || 0),
    0
  );
  const averageRating =
    shopRatings.length > 0 ? totalRating / shopRatings.length : 0;

  return {
    id: rawShop.id,
    name: rawShop.name,
    imageUrl: rawShop.photo_url || "/next.svg",
    url: rawShop.url || "",
    hours: rawShop.business_hours || "N/A",
    location: rawShop.location || "",
    category: rawShop.category || [], // Default to empty array
    detailed_category: rawShop.detailed_category || "",
    description: rawShop.comments || "No description provided.",
    comments: rawShop.comments, // Add comments property
    tags: rawShop.detailed_category
      ? rawShop.detailed_category.split(",").map((tag: string) => tag.trim())
      : [],
    user: {
      id: ownerUser?.id || rawShop.user_id!,
      username: ownerUser?.username || "Unknown User",
      avatar_url:
        ownerUser?.avatar_url ||
        "https://avatars.githubusercontent.com/u/1?v=4",
    },
    likes: shopLikes.length,
    liked: currentUserId
      ? shopLikes.some(
          (like: { user_id: string }) => like.user_id === currentUserId
        )
      : false,
    rating: parseFloat(averageRating.toFixed(1)),
    reviewCount: shopReviews.length,
    searchable_categories_text: rawShop.searchable_categories_text ?? null,
    // --- Google Maps Platform 関連の追加フィールド ---
    latitude: rawShop.latitude ?? null,
    longitude: rawShop.longitude ?? null,
    place_id: rawShop.place_id ?? null,
    formatted_address: rawShop.formatted_address ?? null,
    nearest_station_name: rawShop.nearest_station_name ?? null,
    nearest_station_place_id: rawShop.nearest_station_place_id ?? null,
    walk_time_from_station: rawShop.walk_time_from_station ?? null,
  };
}
