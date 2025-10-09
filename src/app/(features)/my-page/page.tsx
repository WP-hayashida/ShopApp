"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Shop } from "@/app/(features)/_lib/types";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/app/(features)/_components/ProfileForm";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mapSupabaseShopToShop, RawSupabaseShop } from "../_lib/shopMapper"; // Import RawSupabaseShop
import { useRouter } from "next/navigation";

/**
 * マイページコンポーネント
 * ユーザーのプロフィール、投稿したお店、お気に入りのお店をタブで表示します。
 */
export default function MyPage() {
  const router = useRouter();
  // Supabaseクライアントの初期化
  const supabase = useMemo(() => createClient(), []);

  // ステート変数の定義
  const [user, setUser] = useState<User | null>(null); // ログインユーザー情報
  const [profile, setProfile] = useState<{
    // ユーザープロフィール
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true); // ローディング状態
  const [shops, setShops] = useState<Shop[]>([]); // ユーザーが投稿したお店のリスト
  const [likedShops, setLikedShops] = useState<Shop[]>([]); // ユーザーがお気に入りしたお店のリスト

  // 副作用フック：ユーザー情報と関連データの取得
  useEffect(() => {
    const fetchUserAndData = async () => {
      // ユーザー情報を取得
            const { data: { user }, } = await supabase.auth.getUser();
            setUser(user);
            

      if (user) {
        // プロフィール情報を取得
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setProfile(profileData);
        } else {
          // プロフィールが存在しない場合、デフォルトのプロフィールを作成
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: user.user_metadata?.name || "Unnamed User",
              avatar_url: user.user_metadata?.avatar_url || null,
            });

          if (insertError) {
            console.error("Error creating default profile:", insertError);
          } else {
            setProfile({
              username: user.user_metadata?.name || "Unnamed User",
              avatar_url: user.user_metadata?.avatar_url || null,
            });
          }
        }

        // ユーザーが投稿したお店の情報を取得
        const { data: fetchedShops, error: shopsError } = await supabase
          .from("shops")
          .select(
            `
            id, created_at, name, photo_url, url, business_hours, location, category, detailed_category, comments, user_id,
            likes(user_id),
            ratings(rating),
            reviews(id)
          `
          )
          .eq("user_id", user.id);

        if (shopsError) {
          console.error("Error fetching shops for MyPage:", shopsError);
        } else {
          const mappedShops = await Promise.all(
            (fetchedShops || []).map((shop: RawSupabaseShop) => mapSupabaseShopToShop(shop, supabase, user.id))
          );
          setShops(mappedShops);
        }

        // ユーザーがお気に入りしたお店のIDリストを取得
        const { data: likedShopIds, error: likedShopIdsError } = await supabase
          .from("likes")
          .select("shop_id")
          .eq("user_id", user.id);

        if (likedShopIdsError) {
          console.error("Error fetching liked shop IDs:", likedShopIdsError);
        } else {
          const shopIds = likedShopIds.map(like => like.shop_id);
          
          // お店の情報を取得
          const { data: fetchedLikedShops, error: likedShopsError } = await supabase
            .from("shops")
            .select(
              `
              id, created_at, name, photo_url, url, business_hours, location, category, detailed_category, comments, user_id,
              likes(user_id),
              ratings(rating),
              reviews(id)
            `
            )
            .in("id", shopIds);

          if (likedShopsError) {
            console.error("Error fetching liked shops:", likedShopsError);
          } else {
            const mappedLikedShops = await Promise.all(
              (fetchedLikedShops || []).map((shop: RawSupabaseShop) => mapSupabaseShopToShop(shop, supabase, user.id))
            );
            setLikedShops(mappedLikedShops);
          }
        }
      }
      setLoading(false);
    };

    fetchUserAndData();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        // 認証状態が変わったらデータを再取得
        fetchUserAndData();
      }
    );

    // クリーンアップ関数：リスナーを解除
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, user?.id]); // Add user.id to dependencies

  // Googleでサインインする処理
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未ログイン時の表示
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

  const myPosts = shops;

  // ログイン後の表示
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">マイページ</h1>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="favorites">お気に入りのお店</TabsTrigger>
          <TabsTrigger value="posts">投稿したお店</TabsTrigger>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
        </TabsList>
        {/* プロフィールタブ */}
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
        {/* 投稿したお店タブ */}
        <TabsContent value="posts">
          <section className="mt-8">
            {myPosts.length > 0 ? (
              <FilterableShopList
                initialShops={myPosts}
                availableCategories={[]} // Provide an empty array for now
                onNavigate={(page, shop) => router.push(`/shops/${shop.id}`)} // Implement navigation
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
                availableCategories={[]} // Provide an empty array for now
                onNavigate={(page, shop) => router.push(`/shops/${shop.id}`)} // Implement navigation
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
