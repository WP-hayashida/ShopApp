"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { Shop, SearchFilters } from "@/app/(features)/_lib/types";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./_components/ProfileForm";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { getShopsByUserId, getLikedShopsByUserId } from "../_lib/shopService";
import { upsertUserProfile, Profile } from "../_lib/userService";
import { useAuth } from "@/context/AuthContext";
import { useLikeShop } from "@/app/(features)/_hooks/useLikeShop"; // Import useLikeShop

// デフォルトの検索フィルター
const defaultSearchFilters: SearchFilters = {
  keyword_general: "",
  sortBy: "created_at.desc",
};

/**
 * マイページコンポーネント
 * ユーザーのプロフィール、投稿したお店、お気に入りのお店をタブで表示します。
 */
export default function MyPageContents() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signIn } = useAuth();
  const { isLiking, handleLikeToggle } = useLikeShop(); // Use useLikeShop hook

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [likedShops, setLikedShops] = useState<Shop[]>([]);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>(defaultSearchFilters);

  const fetchUserData = useCallback(
    async (currentUser: User, filters: SearchFilters) => {
      setLoading(true);
      const [userProfile, userShops, userLikedShops] = await Promise.all([
        upsertUserProfile(currentUser),
        getShopsByUserId(currentUser.id, filters),
        getLikedShopsByUserId(currentUser.id, filters),
      ]);

      setProfile(userProfile);
      setShops(userShops);
      setLikedShops(userLikedShops);
      setLoading(false);
    },
    [] // Remove supabase from dependencies
  );

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchUserData(user, currentFilters);
      } else {
        setProfile(null);
        setShops([]);
        setLikedShops([]);
        setLoading(false);
      }
    }
  }, [user, authLoading, currentFilters, fetchUserData]);

  const handleLikeToggleForMyPage = async (shopId: string, initialLikedStatus: boolean) => {
    await handleLikeToggle(shopId, initialLikedStatus, (updatedShop) => {
      // Update shops list
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

      // Update likedShops list
      setLikedShops((prevLikedShops) => {
        if (updatedShop.liked) {
          // If liked, add to likedShops if not already there
          const shopToAdd = shops.find((s) => s.id === updatedShop.id);
          if (shopToAdd && !prevLikedShops.some((s) => s.id === updatedShop.id)) {
            return [...prevLikedShops, { ...shopToAdd, liked: true, likes: shopToAdd.likes + 1 }];
          }
        } else {
          // If unliked, remove from likedShops
          return prevLikedShops.filter((s) => s.id !== updatedShop.id);
        }
        return prevLikedShops; // No change if not found or already there
      });
    });
  };

  const handleSearchSubmit = (filters: SearchFilters) => {
    setCurrentFilters(filters);
  };

  const activeTab = searchParams.get('tab') || 'favorites';

  const handleNavigateToShopDetail = (shop: Shop) => {
    router.push(`/shops/${shop.id}?fromTab=${activeTab}`);
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">マイページ</h1>
        <p>このページを表示するにはサインインが必要です。</p>
        <Button onClick={signIn} className="mt-4">
          Googleでサインイン
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">マイページ</h1>

      <Tabs
        defaultValue={activeTab}
        onValueChange={(value) => {
          router.push(`/my-page?tab=${value}`);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="favorites">お気に入りのお店</TabsTrigger>
          <TabsTrigger value="posts">投稿したお店</TabsTrigger>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <section className="mt-8">
            {profile ? (
              <ProfileForm
                initialUsername={profile.username}
                initialAvatarUrl={profile.avatar_url}
              />
            ) : (
              <p>プロフィールの読み込みに失敗しました。</p>
            )}
          </section>
        </TabsContent>
        <TabsContent value="posts">
          <section className="mt-8">
            {shops.length > 0 ? (
              <FilterableShopList
                initialShops={shops}
                availableCategories={[]}
                onNavigate={(page, shop) => handleNavigateToShopDetail(shop)}
                onSearchSubmit={handleSearchSubmit}
                onLikeToggle={handleLikeToggleForMyPage} // Use the new handler
                isLiking={isLiking}
                user={user}
                onEdit={(shopId) => router.push(`/my-page/edit/${shopId}`)}
              />
            ) : (
              <p>まだ投稿したお店はありません。</p>
            )}
          </section>
        </TabsContent>
        {/* お気に入りのお店タブ */}
        <TabsContent value="favorites">
          <section className="mt-8">
            {likedShops.length > 0 ? (
              <FilterableShopList
                initialShops={likedShops}
                availableCategories={[]}
                onNavigate={(page, shop) => handleNavigateToShopDetail(shop)}
                onSearchSubmit={handleSearchSubmit}
                onLikeToggle={handleLikeToggleForMyPage} // Use the new handler
                isLiking={isLiking}
                user={user}
              />
            ) : (
              <p>お気に入りのお店はまだありません。</p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
