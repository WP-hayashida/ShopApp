"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilters, Shop } from "../_lib/types";
import { searchShops } from "../_lib/shopService";
import { useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import FilterableShopList from "../_components/FilterableShopList";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * ホームページのクライアントサイドコンポーネント
 * 店舗リストの表示、検索フィルターの管理、Supabaseからのデータ取得を統括する
 */
export default function HomePage() {
  const supabase = createClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const router = useRouter();

  const { searchTerm, categoryFilter } = useSearch();
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const shopsData = await searchShops(appliedFilters);
      setShops(shopsData);

      setLoading(false);
      setIsSearching(false);
    };

    getInitialData();
  }, [appliedFilters, supabase.auth]);

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

  const handleLikeToggle = async (shopId: string, newLikedStatus: boolean) => {
    if (!user) return;
    setIsLiking(true);

    try {
      if (newLikedStatus) {
        const { error } = await supabase.from("likes").insert({
          user_id: user.id,
          shop_id: shopId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("shop_id", shopId);
        if (error) throw error;
      }

      setShops((prevShops) =>
        prevShops.map((s) => {
          if (s.id === shopId) {
            return {
              ...s,
              liked: newLikedStatus,
              likes: s.likes + (newLikedStatus ? 1 : -1),
            };
          }
          return s;
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
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
        onLikeToggle={handleLikeToggle}
        isLiking={isLiking}
        user={user}
      />
    </main>
  );
}
