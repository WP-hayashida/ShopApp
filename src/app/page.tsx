'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shop } from "@/app/(features)/_lib/types";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getShops = async () => {
      setLoading(true);

      const { data: shopsData, error: shopsError } = await supabase
        .from("shops")
        .select("*");

      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("shop_id");

      if (shopsError || likesError) {
        console.error("Error fetching shops or likes:", shopsError || likesError);
        setShops([]);
      } else {
        const likesCount = likesData.reduce((acc, like) => {
          acc[like.shop_id] = (acc[like.shop_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

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

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>お店を読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-24">
      <div className="flex items-center justify-center w-full relative mb-4">
        <h1 className="text-3xl font-bold">Our Shops</h1>
      </div>
      <FilterableShopList initialShops={shops} />
    </main>
  );
}
