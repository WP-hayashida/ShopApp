"use client";

import { useState, useMemo } from "react";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop } from "@/app/(features)/_lib/types";
import {
  SearchControls,
  SearchFilters,
} from "@/app/(features)/_components/SearchControls";

import { Button } from "@/components/ui/button";

// フィルターの初期状態
const initialFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: "",
  sortBy: "created_at.desc",
};

// コンポーネントのプロパティの型定義
interface FilterableShopListProps {
  initialShops: Shop[]; // 表示するお店の初期リスト
  initialRowCount?: number; // 初期表示する行数
}

/**
 * フィルタリングとソートが可能な店舗リストコンポーネント
 * @param initialShops - 表示する店舗の初期配列
 * @param initialRowCount - 初期表示する行数（デフォルトは1行）
 */
export default function FilterableShopList({
  initialShops,
  initialRowCount = 1,
}: FilterableShopListProps) {
  // ステート変数の定義
  const [filters, setFilters] = useState<SearchFilters>(initialFilters); // フィルター条件
  const [expanded, setExpanded] = useState(false); // 「さらに表示」の状態

  // フィルターとソートが適用された店舗リストをメモ化
  const filteredAndSortedShops = useMemo(() => {
    let filtered = [...initialShops];

    // キーワードによるフィルタリング
    if (filters.keyword) {
      const lowercasedKeyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(lowercasedKeyword) ||
          (shop.detailed_category &&
            shop.detailed_category.toLowerCase().includes(lowercasedKeyword)) ||
          (shop.comments &&
            shop.comments.toLowerCase().includes(lowercasedKeyword))
      );
    }

    // 場所によるフィルタリング
    if (filters.location) {
      filtered = filtered.filter((shop) => shop.location === filters.location);
    }

    // カテゴリによるフィルタリング
    if (filters.category) {
      filtered = filtered.filter((shop) => shop.category === filters.category);
    }

    // ソート処理
    const [field, order] = filters.sortBy.split(".");
    if (field && order) {
      filtered.sort((a, b) => {
        const aValue = a[field as keyof Shop];
        const bValue = b[field as keyof Shop];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return order === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return order === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [initialShops, filters]);

  // 表示する店舗リストをメモ化（「さらに表示」の状態を考慮）
  const shopsToShow = useMemo(() => {
    if (expanded || !initialRowCount) {
      return filteredAndSortedShops;
    }
    // 3列表示を前提としている
    return filteredAndSortedShops.slice(0, initialRowCount * 3);
  }, [filteredAndSortedShops, expanded, initialRowCount]);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full flex justify-end">
        {/* 検索・絞り込みコントロール */}
        <SearchControls initialFilters={filters} onSearch={setFilters} />
      </div>
      {/* 店舗リスト */}
      <ShopList shops={shopsToShow} />
      {/* 「さらに表示」ボタン */}
      {!expanded && filteredAndSortedShops.length > shopsToShow.length && (
        <Button onClick={() => setExpanded(true)} variant="outline" className="mt-4">
          さらに表示
        </Button>
      )}
    </div>
  );
}
