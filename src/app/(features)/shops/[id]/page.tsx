"use client";

import React from "react";
import { StoreDetail } from "@/components/StoreDetail";
import { useParams } from "next/navigation";
import { useShopDetails } from "./_hooks/useShopDetails";

export default function ShopDetailPage() {
  const params = useParams();
  const shopId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!shopId) {
    return (
      <div className="text-center py-16">ショップIDが見つかりません。</div>
    );
  }

  const { store, loading, handleLikeToggle, handleNavigateBack } =
    useShopDetails(shopId);

  if (loading) {
    return <div className="text-center py-16">読み込み中...</div>;
  }

  if (!store) {
    return (
      <div className="text-center py-16">お店が見つかりませんでした。</div>
    );
  }

  return (
    <StoreDetail
      store={store}
      onNavigate={handleNavigateBack}
      onLikeToggle={handleLikeToggle}
    />
  );
}
