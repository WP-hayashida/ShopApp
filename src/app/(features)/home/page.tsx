"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop } from "@/app/(features)/_lib/types";

/**
 * （現在未使用）ホームページのシンプルなバージョン。
 * すべてのお店情報を取得し、リスト表示する機能のみを持ちます。
 */
export default function HomePage() {
  // ステート変数の定義
  const [shops, setShops] = useState<Shop[]>([]); // お店のリスト
  const [loading, setLoading] = useState(true); // ローディング状態
  const supabase = createClient();

  // 副作用フック：お店情報を取得
  useEffect(() => {
    const getShops = async () => {
      const { data, error } = await supabase.from("shops").select("*");
      if (error) {
        console.error("Error fetching shops:", error);
      } else {
        setShops(data as Shop[]);
      }
      setLoading(false);
    };

    getShops();
  }, [supabase]);

  // ローディング中の表示
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>読み込み中...</p>
      </main>
    );
  }

  // メインコンテンツの表示
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <ShopList shops={shops} />
    </main>
  );
}
