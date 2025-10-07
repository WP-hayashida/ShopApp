"use client";

import { useState, useEffect, useMemo } from "react";
import ShopList from "@/app/(features)/_components/ShopList";
import { Shop } from "@/app/(features)/_lib/types";
import {
  SearchControls,
  SearchFilters,
} from "@/app/(features)/_components/SearchControls";

const initialFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: "",
  sortBy: "created_at.desc",
};

interface FilterableShopListProps {
  initialShops: Shop[];
}

export default function FilterableShopList({
  initialShops,
}: FilterableShopListProps) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const filteredAndSortedShops = useMemo(() => {
    let filtered = [...initialShops];

    if (filters.keyword) {
      const lowercasedKeyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(lowercasedKeyword) ||
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

  useEffect(() => {
    setShops(filteredAndSortedShops);
  }, [filteredAndSortedShops]);

  return (
    <div className="flex flex-col items-end w-full h-full">
      <SearchControls initialFilters={filters} onSearch={setFilters} />
      <ShopList shops={shops} />
    </div>
  );
}
