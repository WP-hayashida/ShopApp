import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Shop,
  RpcShopReturnType,
  ShopSearchRpcArgs,
  SearchFilters,
  ShopPayload,
} from "./types";
import { mapRpcShopToShop } from "./shopMapper";

let supabase: SupabaseClient | null = null;

const getSupabase = () => {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabase;
};

/**
 * 店舗を検索する
 * @param filters 検索フィルター
 * @param postedByUserId 投稿者IDでの絞り込み
 * @param likedByUserId いいねしたユーザーIDでの絞り込み
 * @param shopId 店舗IDでの絞り込み
 * @returns 整形された店舗データの配列
 */
export const searchShops = async (
  filters: SearchFilters,
  postedByUserId?: string | null,
  likedByUserId?: string | null,
  shopId?: string | null
): Promise<Shop[]> => {
  const supabaseClient = getSupabase();
  const {
    data: { user: currentUser },
  } = await supabaseClient.auth.getUser();
  const currentUserId = currentUser?.id || null;

  const rpcArgs: ShopSearchRpcArgs = {
    p_keyword_general: filters.keyword_general || null,
    p_keyword_location: filters.keyword_location || null,
    p_category_filter:
      filters.category && filters.category.length > 0 ? filters.category : null,
    p_search_lat: filters.search_lat ?? null,
    p_search_lng: filters.search_lng ?? null,
    p_search_radius: filters.search_radius ?? 1000.0,
    p_sort_by: filters.sortBy ?? "created_at.desc",
    p_current_user_id: currentUserId,
    p_posted_by_user_id: postedByUserId || null,
    p_liked_by_user_id: likedByUserId || null,
    p_shop_id: shopId || null,
  };

  const { data, error } = await supabaseClient.rpc("search_shops", rpcArgs);

  if (error) {
    console.error("Error fetching shops via RPC:", error.message || error);
    return [];
  }

  // RPCの戻り値をShop型にマッピング
  return data ? data.map(mapRpcShopToShop) : [];
};

/**
 * IDで単一の店舗を取得する
 * @param id 店舗ID
 * @returns 整形された店舗データ、または見つからない場合はnull
 */
export const getShopById = async (id: string): Promise<Shop | null> => {
  const shops = await searchShops({}, null, null, id);
  return shops.length > 0 ? shops[0] : null;
};

/**
 * 店舗情報を更新する
 * @param id 店舗ID
 * @param updates 更新するデータ
 * @param newPhoto 新しい写真ファイル
 * @returns 更新された店舗データ
 */
export const updateShop = async (
  id: string,
  updates: Partial<ShopPayload>,
  newPhoto: File | null
): Promise<any> => {
  const supabaseClient = getSupabase();
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) throw new Error("User not authenticated.");

  let photo_url = updates.photo_url;

  if (newPhoto) {
    const fileExt = newPhoto.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } =
      await supabaseClient.storage
        .from("shop-photos")
        .upload(fileName, newPhoto);

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from("shop-photos")
      .getPublicUrl(uploadData.path);
    photo_url = publicUrlData.publicUrl;
  }

  const finalUpdates = {
    ...updates,
    photo_url,
  };

  const { data, error } = await supabaseClient
    .from("shops")
    .update(finalUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update shop: ${error.message}`);
  }

  return data;
};

/**
 * 店舗を削除する
 * @param id 店舗ID
 */
export const deleteShop = async (id: string): Promise<void> => {
  const supabaseClient = getSupabase();
  const { error } = await supabaseClient.from("shops").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete shop: ${error.message}`);
  }
};

/**
 * 特定のユーザーが投稿した店舗を取得する
 * @param userId ユーザーID
 * @param filters 検索フィルター
 * @returns 店舗データの配列
 */
export const getShopsByUserId = async (
  userId: string,
  filters: SearchFilters
): Promise<Shop[]> => {
  return searchShops(filters, userId, null);
};

/**
 * 特定のユーザーがいいねした店舗を取得する
 * @param userId ユーザーID
 * @param filters 検索フィルター
 * @returns 店舗データの配列
 */
export const getLikedShopsByUserId = async (
  userId: string,
  filters: SearchFilters
): Promise<Shop[]> => {
  return searchShops(filters, null, userId);
};
