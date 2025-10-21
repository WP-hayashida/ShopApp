"use client";

import React from "react";

import ShopCard from "./ShopCard";
import { Shop } from "../_lib/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// お店のリストを受け取り、グリッドレイアウトで表示するコンポーネント
interface ShopListProps {
  shops: Shop[]; // 表示するお店の配列
  onNavigate: (page: "detail", shop: Shop) => void; // Add onNavigate prop
  onLikeToggle: (shopId: string, isLiked: boolean) => Promise<void>;
  isLiking: boolean;
  user: SupabaseUser | null;
  onEdit?: (shopId: string) => void;
}

const ShopList: React.FC<ShopListProps> = ({
  shops,
  onNavigate,
  onLikeToggle,
  isLiking,
  user,
  onEdit,
}) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            onNavigate={onNavigate}
            onLikeToggle={onLikeToggle}
            isLiking={isLiking}
            user={user}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopList;
