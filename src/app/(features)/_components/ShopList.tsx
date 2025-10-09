"use client";

import React from "react";

import ShopCard from "./ShopCard";
import { Shop } from "../_lib/types";

// お店のリストを受け取り、グリッドレイアウトで表示するコンポーネント
interface ShopListProps {
  shops: Shop[]; // 表示するお店の配列
  onNavigate: (page: 'detail', shop: Shop) => void; // Add onNavigate prop
}

const ShopList: React.FC<ShopListProps> = ({ shops, onNavigate }) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export default ShopList;
