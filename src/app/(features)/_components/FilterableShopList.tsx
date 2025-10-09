import { useState, useMemo } from "react";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop } from "@/app/(features)/_lib/types";
import {
  SearchControls,
  SearchFilters,
} from "@/app/(features)/_components/SearchControls";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// フィルターの初期状態 (for SearchControls)
const defaultSearchControlsFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: "",
  sortBy: "created_at.asc", // 新着順をデフォルトに
};

// コンポーネントのプロパティの型定義
interface FilterableShopListProps {
  initialShops: Shop[]; // 表示するお店の初期リスト
  initialRowCount?: number; // 初期表示する行数
  availableCategories: string[]; // 利用可能なカテゴリのリスト
  onNavigate: (page: 'detail', shop: Shop) => void;
  headerKeyword?: string; // Changed from initialKeyword
  isSearching?: boolean; // New prop for search loading state
}

/**
 * フィルタリングとソートが可能な店舗リストコンポーネント
 * @param initialShops - 表示する店舗の初期配列
 * @param initialRowCount - 初期表示する行数（デフォルトは1行）
 * @param availableCategories - 利用可能なカテゴリの配列
 * @param headerKeyword - ヘッダー検索バーからのキーワード
 * @param isSearching - 検索中かどうかを示すフラグ
 */
export default function FilterableShopList({
  initialShops,
  initialRowCount = 1,
  availableCategories,
  onNavigate,
  headerKeyword = "", // Destructure headerKeyword with default
  isSearching = false, // Destructure isSearching with default
}: FilterableShopListProps) {
  // ステート変数の定義
  const [searchControlsFilters, setSearchControlsFilters] = useState<SearchFilters>({
    ...defaultSearchControlsFilters,
    keyword: headerKeyword,
  });
  const [expanded, setExpanded] = useState(false);

  // カテゴリバッジクリック時のハンドラ (updates searchControlsFilters)
  const handleCategoryClick = (category: string) => {
    setSearchControlsFilters((prevFilters) => ({
      ...prevFilters,
      category: category === "すべて" ? "" : (prevFilters.category === category ? "" : category),
    }));
  };

  // フィルターとソートが適用された店舗リストをメモ化
  const filteredAndSortedShops = useMemo(() => {
    let filtered = [...initialShops];

    // SearchControlsからのキーワードによるフィルタリング
    if (searchControlsFilters.keyword) {
      const lowercasedKeyword = searchControlsFilters.keyword.toLowerCase();
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
    if (searchControlsFilters.location) {
      filtered = filtered.filter((shop) => shop.location === searchControlsFilters.location);
    }

    // カテゴリによるフィルタリング
    if (searchControlsFilters.category) {
      const lowercasedCategory = searchControlsFilters.category.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.category.toLowerCase().includes(lowercasedCategory) ||
          (shop.detailed_category &&
            shop.detailed_category.toLowerCase().includes(lowercasedCategory))
      );
    }

    // ソート処理
    const [field, order] = searchControlsFilters.sortBy.split(".");
    if (field && order) {
      // Create a new array to ensure React detects a change
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[field as keyof Shop];
        const bValue = b[field as keyof Shop];

        if (aValue === null || aValue === undefined) return order === "asc" ? 1 : -1;
        if (bValue === null || bValue === undefined) return order === "asc" ? -1 : 1;

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
  }, [initialShops, searchControlsFilters]); // Removed headerKeyword from dependencies

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
      <div className="w-full flex justify-between items-center mb-4">
        {/* カテゴリバッジ */}
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <Badge
              key={category}
              variant={
                (searchControlsFilters.category === "" && category === "すべて") ||
                (searchControlsFilters.category === category && category !== "すべて")
                  ? "default"
                  : "outline"
              }
              onClick={() => handleCategoryClick(category)}
              className="cursor-pointer px-3 py-1 text-sm"
            >
              {category}
            </Badge>
          ))}
        </div>
        {/* 検索・絞り込みコントロール */}
        <SearchControls initialFilters={searchControlsFilters} onSearch={setSearchControlsFilters} />
      </div>
      {/* 店舗リスト */}
      {isSearching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 w-full">
          {Array.from({ length: initialRowCount * 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-200 h-96 animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <ShopList shops={shopsToShow} onNavigate={onNavigate} />
      )}
      {/* 「さらに表示」ボタン */}
      {!expanded && filteredAndSortedShops.length > shopsToShow.length && (
        <Button onClick={() => setExpanded(true)} variant="outline" className="mt-4">
          さらに表示
        </Button>
      )}
    </div>
  );
}
