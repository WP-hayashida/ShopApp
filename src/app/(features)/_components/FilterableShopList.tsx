import { useState, useMemo, useEffect } from "react";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop, SearchFilters } from "@/app/(features)/_lib/types";
import { SearchControls } from "@/app/(features)/_components/SearchControls";
import { useSearch } from "@/context/SearchContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


// フィルターの初期状態 (for SearchControls)
const defaultSearchControlsFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: [], // 変更
  sortBy: "created_at.asc", // 新着順をデフォルトに
};

// コンポーネントのプロパティの型定義1
interface FilterableShopListProps {
  initialShops: Shop[]; // 表示するお店の初期リスト
  initialRowCount?: number; // 初期表示する行数
  availableCategories: string[]; // 利用可能なカテゴリのリスト
  onNavigate: (page: "detail", shop: Shop) => void;
  headerKeyword?: string; // Changed from initialKeyword
  isSearching?: boolean; // New prop for search loading state
  onSearchSubmit: (filters: SearchFilters) => void; // New prop to submit filters
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
  onSearchSubmit, // Destructure new prop
}: FilterableShopListProps) {
  // ステート変数の定義
  const { categoryFilter, setCategoryFilter, searchTerm, setSearchTerm } =
    useSearch(); // Use SearchContext
  const [searchControlsFilters, setSearchControlsFilters] =
    useState<SearchFilters>({
      ...defaultSearchControlsFilters,
      keyword: headerKeyword,
      category: categoryFilter, // Initialize with context categoryFilter
    });
  const [expanded, setExpanded] = useState(false);

  // Update local filters when context changes
  useEffect(() => {
    setSearchControlsFilters((prev) => ({
      ...prev,
      category: categoryFilter,
      keyword: searchTerm, // Also update keyword from context
    }));
  }, [categoryFilter, searchTerm]);

  // Function to handle search from SearchControls
  const handleSearchControlsSubmit = (filters: SearchFilters) => {
    setSearchTerm(filters.keyword); // Update searchTerm in context
    // categoryFilter is already updated by SearchControls directly
    // location and sortBy are handled by HomePageClient's useEffect
    onSearchSubmit(filters); // Submit all filters to HomePageClient
  };

  // カテゴリバッジクリック時のハンドラ (updates SearchContext)
  const handleCategoryClick = (category: string) => {
    const newCategories = (() => {
      if (category === "すべて") {
        return [];
      }
      if (categoryFilter.includes(category)) {
        return categoryFilter.filter((cat) => cat !== category);
      }
      return [...categoryFilter, category];
    })();

    setCategoryFilter(newCategories);

    onSearchSubmit({
      ...searchControlsFilters,
      category: newCategories,
    });
  };

  // フィルターとソートが適用された店舗リストをメモ化
  const filteredAndSortedShops = useMemo(() => {
    let filtered = [...initialShops];

    // SearchControlsからのキーワードによるフィルタリング (client-side for initialShops)
    if (searchControlsFilters.keyword) {
      const lowercasedKeyword = searchControlsFilters.keyword.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(lowercasedKeyword) ||
          (shop.detailed_category &&
            shop.detailed_category.toLowerCase().includes(lowercasedKeyword)) ||
          (shop.comments &&
            shop.comments.toLowerCase().includes(lowercasedKeyword)) ||
          (shop.searchable_categories_text && // Use new searchable text
            shop.searchable_categories_text
              .toLowerCase()
              .includes(lowercasedKeyword))
      );
    }

    // 場所によるフィルタリング (client-side for initialShops)
    if (searchControlsFilters.location) {
      filtered = filtered.filter(
        (shop) => shop.location === searchControlsFilters.location
      );
    }

    // カテゴリによるフィルタリングはサーバーサイドで行われるため、ここでは削除
    // if (searchControlsFilters.category.length > 0) {
    //   filtered = filtered.filter((shop) =>
    //     searchControlsFilters.category.some(cat => shop.category.includes(cat))
    //   );
    // }

    // ソート処理
    const [field, order] = searchControlsFilters.sortBy.split(".");
    if (field && order) {
      // Create a new array to ensure React detects a change
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[field as keyof Shop];
        const bValue = b[field as keyof Shop];

        if (aValue === null || aValue === undefined)
          return order === "asc" ? 1 : -1;
        if (bValue === null || bValue === undefined)
          return order === "asc" ? -1 : 1;

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
  }, [initialShops, searchControlsFilters]);

  // 表示する店舗リストをメモ化（「さらに表示」の状態を考慮）
  const shopsToShow = useMemo(() => {
    if (expanded || !initialRowCount) {
      return filteredAndSortedShops;
    }
    // 3列表示を前提としている
    return filteredAndSortedShops.slice(0, initialRowCount * 3);
  }, [filteredAndSortedShops, expanded, initialRowCount]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center mb-4">
        {/* カテゴリバッジ */}
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <Badge
              key={category}
              variant={
                (categoryFilter.length === 0 && category === "すべて") ||
                (categoryFilter.includes(category) && category !== "すべて")
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
        <SearchControls
          initialFilters={searchControlsFilters}
          onSearch={handleSearchControlsSubmit}
        />
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
        <Button
          onClick={() => setExpanded(true)}
          variant="outline"
          className="mt-4"
        >
          さらに表示
        </Button>
      )}
    </div>
  );
}
