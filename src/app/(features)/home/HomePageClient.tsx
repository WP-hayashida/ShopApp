"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilters, Shop, ShopSearchRpcArgs, RpcShopReturnType } from "../_lib/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { createClient } from "@/lib/supabase/client";
import FilterableShopList from "../_components/FilterableShopList";
import { Database } from "@/lib/database.types";



/**
 * ホームページのクライアントサイドコンポーネント
 * 店舗リストの表示、検索フィルターの管理、Supabaseからのデータ取得を統括する
 */
export default function HomePageClient() {
  // 店舗データのstate
  const [shops, setShops] = useState<Shop[]>([]);
  // 初期ロード状態
  const [loading, setLoading] = useState(true);
  // 検索実行中の状態
  const [isSearching, setIsSearching] = useState(false);
  // Supabaseクライアントインスタンス
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const router = useRouter();

  // SearchContextから検索キーワードとカテゴリフィルターを取得
  const { searchTerm, categoryFilter } = useSearch();
  // 現在適用されているフィルターの状態
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({
    keyword_general: searchTerm,
    keyword_location: "",
    search_lat: null, // 周辺検索用緯度
    search_lng: null, // 周辺検索用経度
    search_radius: null, // 周辺検索用半径
    location_text: "", // UI表示用の場所テキスト
    category: categoryFilter,
    sortBy: "created_at.desc", // デフォルトの並び順は新着順
  });

  /**
   * 店舗詳細ページへのナビゲーションハンドラ
   * @param page - 遷移先のページタイプ
   * @param shop - 遷移する店舗データ
   */
  const handleNavigate = (page: "detail", shop: Shop) => {
    if (page === "detail") {
      router.push(`/shops/${shop.id}`);
    }
  };

  // Supabaseクライアントの初期化
  useEffect(() => {
    const initSupabase = () => {
      const client = createClient();
      setSupabase(client);
    };
    initSupabase();
  }, []);

  /**
   * フィルターが変更された際にSupabaseから店舗データを取得するエフェクト
   * サーバーサイドのRPC関数 `search_shops` を呼び出す
   */
  useEffect(() => {
    if (!supabase) return;

    const getShops = async () => {
      setIsSearching(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id || null;

      console.log("Calling RPC with filters:", appliedFilters);

      const rpcArgs: ShopSearchRpcArgs = {
        p_keyword_general: appliedFilters.keyword_general || null,
        p_keyword_location: appliedFilters.keyword_location || null,
        p_category_filter:
          appliedFilters.category && appliedFilters.category.length > 0
            ? appliedFilters.category
            : null,
        p_search_lat: appliedFilters.search_lat ?? null,
        p_search_lng: appliedFilters.search_lng ?? null,
        p_search_radius: appliedFilters.search_radius ?? 1000.0,
        p_sort_by: appliedFilters.sortBy ?? "created_at.desc",
        p_current_user_id: currentUserId,
      };

      const { data, error } = await supabase.rpc("search_shops", rpcArgs);

      if (error) {
        console.error("Error fetching shops via RPC:", error.message || error);
        setShops([]);
      } else if (data) {
        const shopsData = data.map((shop: RpcShopReturnType) => ({
          id: shop.id,
          name: shop.name,
          imageUrl: shop.photo_url_api || shop.photo_url || "/next.svg",
          url: shop.url || "",
          hours: shop.business_hours || "N/A",
          location: shop.location || "",
          category: shop.category || [],
          detailed_category: shop.detailed_category || "",
          description: shop.comments || "説明がありません。",
          comments: shop.comments,
          tags: shop.tags || [],
          user: {
            username: shop.username || "unknown",
            avatar_url: shop.avatar_url || null,
          },
          likes: shop.like_count || 0,
          liked: shop.liked || false,
          rating: shop.rating || 0,
          reviewCount: shop.review_count || 0,
          searchable_categories_text: shop.searchable_categories_text ?? null,
          latitude: shop.latitude ?? null,
          longitude: shop.longitude ?? null,
          place_id: shop.place_id ?? null,
          formatted_address: shop.formatted_address ?? null,
          nearest_station_name: shop.nearest_station_name ?? null,
          nearest_station_place_id: shop.nearest_station_place_id ?? null,
          walk_time_from_station: shop.walk_time_from_station ?? null,
          price_range: shop.price_range ?? undefined,
          business_hours_weekly: shop.business_hours_weekly ?? null,
          phone_number: shop.phone_number ?? undefined,
          photo_url_api: shop.photo_url_api ?? undefined,
          api_last_updated: shop.api_last_updated ?? undefined,
        }));
        setShops(shopsData);
      } else {
        setShops([]);
      }
      setLoading(false);
      setIsSearching(false);
    };

    getShops();
  }, [supabase, appliedFilters]);

  // ★★★ ここが最終修正箇所 ★★★
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    shops.forEach((shop) => {
      if (shop.category) {
        shop.category.forEach((cat) => categories.add(cat));
      }
      // `shop.tags`配列を直接利用するように修正
      if (shop.tags) {
        shop.tags.forEach((tag) => categories.add(tag));
      }
    });
    return ["すべて", ...Array.from(categories)];
  }, [shops]);

  if (loading) {
    return (
      <main className="flex flex-col items-center p-4 md:p-8 lg:p-12">
        <div className="w-full flex justify-end mb-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-200 h-96 animate-pulse"
            ></div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center p-4 md:p-8 lg:p-12">
      <FilterableShopList
        key={JSON.stringify(appliedFilters)}
        initialShops={shops}
        initialRowCount={2}
        availableCategories={availableCategories}
        onNavigate={handleNavigate}
        headerKeywordGeneral={appliedFilters.keyword_general}
        isSearching={isSearching}
        onSearchSubmit={setAppliedFilters}
      />
    </main>
  );
}
