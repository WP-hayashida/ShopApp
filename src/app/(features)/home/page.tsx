"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilters, Shop } from "../_lib/types";
import { searchShops } from "../_lib/shopService";
import { useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";
import { useLikeShop } from "../_hooks/useLikeShop"; // Import useLikeShop
import FilterableShopList from "../_components/FilterableShopList";

/**
 * ホームページのクライアントサイドコンポーネント
 * 店舗リストの表示、検索フィルターの管理、Supabaseからのデータ取得を統括する
 */
export default function HomePage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { isLiking, handleLikeToggle } = useLikeShop(); // Use useLikeShop hook
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const { searchTerm, categoryFilter, shopListRefreshKey } = useSearch();
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({
    keyword_general: searchTerm,
    keyword_location: "",
    search_lat: null,
    search_lng: null,
    search_radius: null,
    location_text: "",
    category: categoryFilter,
    sortBy: "created_at.desc",
  });

  useEffect(() => {
    const getInitialData = async () => {
      setIsSearching(true);
      setLoading(true);

      const shopsData = await searchShops(appliedFilters);
      setShops(shopsData);

      setLoading(false);
      setIsSearching(false);
    };

    if (!authLoading) {
      getInitialData();
    }
  }, [appliedFilters, authLoading, shopListRefreshKey]);

  // Listen for changes in context and update applied filters
  useEffect(() => {
    setAppliedFilters((prevFilters) => ({
      ...prevFilters,
      keyword_general: searchTerm,
      category: categoryFilter,
    }));
  }, [searchTerm, categoryFilter]);

  const handleNavigate = (page: "detail", shop: Shop) => {
    if (page === "detail") {
      router.push(`/shops/${shop.id}`);
    }
  };

  const handleLikeToggleForList = async (shopId: string, isLiked: boolean) => {
    await handleLikeToggle(shopId, isLiked, (updatedShop) => {
      setShops((prevShops) =>
        prevShops.map((s) => {
          if (s.id === updatedShop.id) {
            return {
              ...s,
              liked: updatedShop.liked,
              likes: s.likes + (updatedShop.liked ? 1 : -1),
            };
          }
          return s;
        })
      );
    });
  };

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    shops.forEach((shop) => {
      if (shop.category) {
        shop.category.forEach((cat) => categories.add(cat));
      }
      if (shop.tags) {
        shop.tags.forEach((tag) => categories.add(tag));
      }
    });
    return ["すべて", ...Array.from(categories)];
  }, [shops]);

  if (loading || authLoading) {
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
        onLikeToggle={handleLikeToggleForList} // Use the new handler
        isLiking={isLiking}
        user={user}
      />
    </main>
  );
}
