import { Shop, User } from "./types";
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
  searchable_categories_text: string | null; // Add this line
}

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
      .select("username, avatar_url")
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
  const averageRating = shopRatings.length > 0 ? totalRating / shopRatings.length : 0;

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
      username: ownerUser?.username || "Unknown User",
      avatar_url: ownerUser?.avatar_url || "https://avatars.githubusercontent.com/u/1?v=4",
    },
    likes: shopLikes.length,
    liked: currentUserId ? shopLikes.some((like: { user_id: string }) => like.user_id === currentUserId) : false,
    rating: parseFloat(averageRating.toFixed(1)),
    reviewCount: shopReviews.length,
    searchable_categories_text: rawShop.searchable_categories_text ?? null, // Add this line
  };
}
