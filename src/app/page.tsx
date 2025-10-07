'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shop } from "@/app/(features)/_lib/types";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";

/**
 * ホームページコンポーネント
 * すべてのお店情報を取得し、フィルタリング可能なリストとして表示します。
 */
export default function HomePage() {
  // ステート変数の定義
  const [shops, setShops] = useState<Shop[]>([]); // お店のリスト
  const [loading, setLoading] = useState(true); // ローディング状態
  const supabase = createClient(); // Supabaseクライアント

  // 副作用フック：お店といいねの情報を取得
  useEffect(() => {
    const getShops = async () => {
      setLoading(true);

      // すべてのお店情報を取得
      const { data: shopsData, error: shopsError } = await supabase
        .from("shops")
        .select("*");

      // すべてのいいね情報を取得
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("shop_id");

      if (shopsError || likesError) {
        console.error("Error fetching shops or likes:", shopsError || likesError);
        setShops([]);
      } else {
        // いいね数を店舗IDごとに集計
        const likesCount = likesData.reduce((acc, like) => {
          acc[like.shop_id] = (acc[like.shop_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // お店情報にいいね数を付与
        const shopsWithLikes = shopsData.map((shop) => ({
          ...shop,
          like_count: likesCount[shop.id] || 0,
        }));

        setShops(shopsWithLikes as Shop[]);
      }
      setLoading(false);
    };

    getShops();
  }, [supabase]);

  // ローディング中の表示
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>お店を読み込み中...</p>
      </main>
    );
  }

  // メインコンテンツの表示
  return (
    <main className="flex min-h-screen flex-col p-24">
      <div className="flex items-center justify-center w-full relative mb-4">
        <h1 className="text-3xl font-bold">Our Shops</h1>
      </div>
      {/* フィルタリング可能な店舗リストコンポーネント */}
      <FilterableShopList initialShops={shops} />
    </main>
  );
}
