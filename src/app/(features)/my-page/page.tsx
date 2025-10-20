"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Shop, SearchFilters } from "@/app/(features)/_lib/types";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/app/(features)/_components/ProfileForm";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { getShopsByUserId, getLikedShopsByUserId } from "../_lib/shopService";
import { upsertUserProfile, Profile } from "../_lib/userService";

// デフォルトの検索フィルター
const defaultSearchFilters: SearchFilters = {
  keyword_general: "",
  sortBy: "created_at.desc",
};

/**
 * マイページコンポーネント
 * ユーザーのプロフィール、投稿したお店、お気に入りのお店をタブで表示します。
 */
export default function MyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [likedShops, setLikedShops] = useState<Shop[]>([]);
  const [currentFilters, setCurrentFilters] =
    useState<SearchFilters>(defaultSearchFilters);
  const [isLiking, setIsLiking] = useState(false);

  const fetchUserData = useCallback(
    async (user: User, filters: SearchFilters) => {
      setLoading(true);
      const [userProfile, userShops, userLikedShops] = await Promise.all([
        upsertUserProfile(user),
        getShopsByUserId(user.id, filters),
        getLikedShopsByUserId(user.id, filters),
      ]);

      setProfile(userProfile);
      setShops(userShops);
      setLikedShops(userLikedShops);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          fetchUserData(sessionUser, currentFilters);
        } else {
          setProfile(null);
          setShops([]);
          setLikedShops([]);
          setLoading(false);
        }
      }
    );

    // 初回ロード時にユーザー情報を取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserData(user, currentFilters);
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, currentFilters, fetchUserData]);

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

      const updateShopState = (shops: Shop[]) =>
        shops.map((s) => {
          if (s.id === shopId) {
            return {
              ...s,
              liked: newLikedStatus,
              likes: s.likes + (newLikedStatus ? 1 : -1),
            };
          }
          return s;
        });

      setShops(updateShopState);

      if (newLikedStatus) {
        const likedShop = shops.find((s) => s.id === shopId);
        if (likedShop && !likedShops.some((s) => s.id === shopId)) {
          setLikedShops((prev) => [
            ...prev,
            { ...likedShop, liked: true, likes: likedShop.likes + 1 },
          ]);
        } else {
          setLikedShops(updateShopState);
        }
      } else {
        setLikedShops((prev) => prev.filter((s) => s.id !== shopId));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSearchSubmit = (filters: SearchFilters) => {
    setCurrentFilters(filters);
  };

  const activeTab = searchParams.get('tab') || 'favorites';

  const handleNavigateToShopDetail = (shop: Shop) => {
    router.push(`/shops/${shop.id}?fromTab=${activeTab}`);
  };

  if (loading) {
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
        <Button onClick={handleSignIn} className="mt-4">
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
                onLikeToggle={handleLikeToggle}
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
                onLikeToggle={handleLikeToggle}
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
