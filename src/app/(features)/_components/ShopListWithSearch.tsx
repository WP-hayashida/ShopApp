"use client";

import { useState, useEffect } from "react";
import ShopList from "@/app/(features)/_components/ShopList";
import { createClient } from "@/lib/supabase/client";
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

export default function ShopListWithSearch() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const supabase = createClient();

  useEffect(() => {
    const getShops = async () => {
      setLoading(true);

      const { keyword, location, category, sortBy } = filters;
      let query;

      if (sortBy === "likes.desc") {
        // Sort by likes using the RPC function
        query = supabase.rpc("get_shops_sorted_by_likes", {
          keyword: keyword || "",
          location_filter: location || "",
          category_filter: category || "",
        });
      } else {
        // Handle created_at sorting
        query = supabase.from("shops").select("*");

        if (keyword) {
          query = query.or(
            `name.ilike.%${keyword}%,comments.ilike.%${keyword}%`
          );
        }
        if (location) {
          query = query.eq("location", location);
        }
        if (category) {
          query = query.eq("category", category);
        }

        const [field, order] = sortBy.split(".");
        query = query.order(field, { ascending: order === "asc" });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching shops:", error);
        setShops([]);
      } else {
        setShops(data as Shop[]);
      }
      setLoading(false);
    };

    getShops();
  }, [supabase, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>お店を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end w-full h-full">
      <SearchControls initialFilters={filters} onSearch={setFilters} />
      <ShopList shops={shops} />
    </div>
  );
}
