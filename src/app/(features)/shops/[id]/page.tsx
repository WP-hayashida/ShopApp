"use client";

import React from "react";
import { ShopDetail } from "./_components/ShopDetail";
import { useParams } from "next/navigation";
import { useShopDetails } from "./_hooks/useShopDetails";

export default function ShopDetailPage() {
  const params = useParams();
  const shopId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Move hook call to the top level
  const { store, loading, handleLikeToggle, handleNavigateBack } =
    useShopDetails(shopId || "");

  if (!shopId) {
    return (
      <div className="text-center py-16">ショップIDが見つかりません。</div>
    );
  }

  if (loading) {
    return <div className="text-center py-16">読み込み中...</div>;
  }

  if (!store) {
    return (
      <div className="text-center py-16">お店が見つかりませんでした。</div>
    );
  }

  return (
    <ShopDetail
      store={store}
      onNavigate={handleNavigateBack}
      onLikeToggle={handleLikeToggle}
    />
  );
}
