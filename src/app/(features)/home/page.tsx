"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop } from "@/app/(features)/_lib/types";

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <ShopList shops={shops} />
    </main>
  );
}
