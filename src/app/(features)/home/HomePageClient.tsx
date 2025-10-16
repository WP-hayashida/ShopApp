"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilters, Shop } from "../_lib/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { createClient } from "@/lib/supabase/client";
import FilterableShopList from "../_components/FilterableShopList";
import { Database } from "@/lib/database.types";

type RpcShopReturn = Database['public']['Functions']['search_shops']['Returns'][number];

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
    keyword: searchTerm,
    search_lat: null, // 周辺検索用緯度
    search_lng: null, // 周辺検索用経度
    search_radius: null, // 周辺検索用半径
    location_text: "", // UI表示用の場所テキスト
    location: "", // Add this line
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
    const initSupabase = async () => {
      const client = await createClient(); // awaitを追加
      setSupabase(client);
    };
    initSupabase();
  }, []);

  /**
   * フィルターが変更された際にSupabaseから店舗データを取得するエフェクト
   * サーバーサイドのRPC関数 `search_shops` を呼び出す
   */
  useEffect(() => {
    if (!supabase) return; // Supabaseクライアントが初期化されていなければ何もしない

    const getShops = async () => {
      setIsSearching(true); // 検索中フラグを立てる
      // 現在のユーザー情報を取得（いいね状態の判定に利用）
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id || null;

      console.log("Calling RPC with filters:", appliedFilters);

      let rpcArgs: any;

      // Always use the geo-search RPC args structure, as the Supabase function handles null geo-coordinates.
      rpcArgs = {
        keyword: appliedFilters.keyword || "",
        category_filter:
          appliedFilters.category && appliedFilters.category.length > 0
            ? appliedFilters.category
            : null,
        search_lat: appliedFilters.search_lat,
        search_lng: appliedFilters.search_lng,
        search_radius: appliedFilters.search_radius !== null
          ? (appliedFilters.search_radius as number).toFixed(1)
          : "1000.0", // Default as string with decimal
        sort_by: appliedFilters.sortBy,
        current_user_id: currentUserId,
      };

      // データベースのRPC関数 `search_shops` を呼び出し、フィルターを適用
      const { data, error } = await supabase.rpc("search_shops", rpcArgs);

      if (error) {
        console.error("Error fetching shops via RPC:", error.message || error);
        setShops([]); // エラー時は空配列をセット
      } else if (data) {
        // RPCから返されたデータをShopインターフェースの形式にマッピング
        // RPC関数がリッチなデータを返すため、mapSupabaseShopToShopは不要
        const shopsData = data.map((shop: RpcShopReturn) => ({
          id: shop.id,
          name: shop.name,
          imageUrl: shop.photo_url || "/next.svg",
          url: shop.url || "",
          hours: shop.business_hours || "N/A",
          location: shop.location || "",
          category: shop.category || [],
          detailed_category: shop.detailed_category || "",
          description: shop.comments || "説明がありません。",
          tags: shop.detailed_category
            ? shop.detailed_category.split(",").map((tag: string) => tag.trim())
            : [],
          user: {
            username: "unknown",
            avatar_url: null,
          },
          likes: shop.like_count || 0,
          liked: false,
          rating: 0,
          reviewCount: 0,
          searchable_categories_text: shop.searchable_categories_text ?? null,
          latitude: null,
          longitude: null,
          place_id: null,
          formatted_address: null,
          nearest_station_name: null,
          walk_time_from_station: null,
        }));
        setShops(shopsData);
      } else {
        setShops([]); // dataがnullやundefinedの場合も空配列をセット
      }
      setLoading(false);
      setIsSearching(false); // 検索中フラグを解除
    };

    getShops();
  }, [supabase, appliedFilters]); // appliedFiltersの変更を監視

  // 利用可能なカテゴリを動的に生成（現在表示されている店舗から抽出）
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    shops.forEach((shop) => {
      if (shop.category) {
        shop.category.forEach((cat) => categories.add(cat));
      }
      if (shop.detailed_category) {
        shop.detailed_category
          .split(",")
          .forEach((cat) => categories.add(cat.trim()));
      }
    });
    return ["すべて", ...Array.from(categories)];
  }, [shops]);

  // ローディング中の表示
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
      {/* フィルターとソート機能を持つ店舗リストコンポーネント */}
      <FilterableShopList
        key={JSON.stringify(appliedFilters)} // フィルター変更時にコンポーネントを強制的に再マウント
        initialShops={shops}
        initialRowCount={2}
        availableCategories={availableCategories}
        onNavigate={handleNavigate}
        headerKeyword={appliedFilters.keyword}
        isSearching={isSearching}
        onSearchSubmit={setAppliedFilters} // appliedFiltersのセッターを渡す
      />
    </main>
  );
}
