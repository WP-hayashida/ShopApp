"use client";

import { useState, useEffect, useMemo } from "react";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop } from "@/app/(features)/_lib/types";
import {
  SearchControls,
  SearchFilters,
} from "@/app/(features)/_components/SearchControls";

import { Button } from "@/components/ui/button";

const initialFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: "",
  sortBy: "created_at.desc",
};

interface FilterableShopListProps {
  initialShops: Shop[];
  initialRowCount?: number;
}

export default function FilterableShopList({
  initialShops,
  initialRowCount = 1,
}: FilterableShopListProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [expanded, setExpanded] = useState(false);

  const filteredAndSortedShops = useMemo(() => {
    let filtered = [...initialShops];

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

    if (filters.location) {
      filtered = filtered.filter((shop) => shop.location === filters.location);
    }

    if (filters.category) {
      filtered = filtered.filter((shop) => shop.category === filters.category);
    }

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

  const shopsToShow = useMemo(() => {
    if (expanded || !initialRowCount) {
      return filteredAndSortedShops;
    }
    return filteredAndSortedShops.slice(0, initialRowCount * 3);
  }, [filteredAndSortedShops, expanded, initialRowCount]);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full flex justify-end">
        <SearchControls initialFilters={filters} onSearch={setFilters} />
      </div>
      <ShopList shops={shopsToShow} />
      {!expanded && filteredAndSortedShops.length > shopsToShow.length && (
        <Button onClick={() => setExpanded(true)} variant="outline" className="mt-4">
          さらに表示
        </Button>
      )}
    </div>
  );
}
