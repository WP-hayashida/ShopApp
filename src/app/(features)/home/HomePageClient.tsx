"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shop } from "@/app/(features)/_lib/types";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import { useSearch } from "@/context/SearchContext";

export default function HomePageClient() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false); // New state for search loading
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const router = useRouter();

    const { searchTerm } = useSearch();

  

    const handleNavigate = (page: "detail", shop: Shop) => {

      if (page === "detail") {

        router.push(`/shops/${shop.id}`);

      }

    };

  

    useEffect(() => {

      const initSupabase = async () => {

        const client = createClient();

        setSupabase(client);

      };

      initSupabase();

    }, []);

  

    useEffect(() => {

      if (!supabase) return;

  

      const getShops = async () => {

        setLoading(true);

        setIsSearching(true); // Set searching to true

        const { data: { user: currentUser }, } = await supabase.auth.getUser();

        const currentUserId = currentUser?.id;

  

        let query = supabase

          .from("shops")

          .select(

            `

            id, name, photo_url, url, business_hours, location, category, detailed_category, comments, price, user_id,

            likes(user_id),

            ratings(rating),

            reviews(id)

          `

          )

          .order("created_at", { ascending: false });

  

        if (searchTerm) {

          const lowercasedSearchTerm = searchTerm.toLowerCase();

          query = query.or(`name.ilike.%${lowercasedSearchTerm}%,detailed_category.ilike.%${lowercasedSearchTerm}%,comments.ilike.%${lowercasedSearchTerm}%`);

        }

  

        const { data, error } = await query;

  

        if (error) {

          console.error("Error fetching shops:", error);

        } else {

          const shopsDataPromises = data.map(async (shop: any) => {

            let ownerUser = null;

            if (shop.user_id) {

              const { data: profileData, error: profileError } = await supabase

                .from("profiles")

                .select("username, avatar_url")

                .eq("id", shop.user_id)

                .single();

              if (profileError) {

                console.error(

                  "Error fetching profile data for user_id:",

                  shop.user_id,

                  profileError

                );

              } else {

                ownerUser = profileData;

              }

            }

  

            const shopLikes = shop.likes || [];

            const shopRatings = shop.ratings || [];

            const shopReviews = shop.reviews || [];

  

            const totalRating = shopRatings.reduce(

              (sum: number, r: { rating: number }) => sum + r.rating,

              0

            );

            const averageRating = (

              shopRatings.length > 0 ? totalRating / shopRatings.length : 0

            );

  

            return {

              id: shop.id,

              name: shop.name,

              imageUrl: shop.photo_url || "/next.svg",

              url: shop.url,

              hours: shop.business_hours || "N/A",

              location: shop.location,

              category: shop.category,

              detailed_category: shop.detailed_category,

              description: shop.comments || "No description provided.",

              price: shop.price || "N/A",

              tags: shop.detailed_category

                ? shop.detailed_category

                    .split(",")

                    .map((tag: string) => tag.trim())

                : [],

              user: {

                name: ownerUser?.username || "Unknown User",

                avatar:

                  ownerUser?.avatar_url ||

                  "https://avatars.githubusercontent.com/u/1?v=4",

                username: ownerUser?.username || "unknown",

              },

              likes: shopLikes.length,

              liked: currentUserId

                ? shopLikes.some(

                    (like: { user_id: string }) => like.user_id === currentUserId

                  )

                : false,

              rating: parseFloat(averageRating.toFixed(1)),

              reviewCount: shopReviews.length,

            };

          });

          const shopsData = await Promise.all(shopsDataPromises);

          setShops(shopsData);

        }

        setLoading(false);

        setIsSearching(false); // Set searching to false

      };

  

      getShops();

    }, [supabase, searchTerm]); // Add searchTerm to dependencies

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    shops.forEach((shop) => {
      if (shop.category) {
        categories.add(shop.category);
      }
      if (shop.detailed_category) {
        shop.detailed_category
          .split(",")
          .forEach((cat) => categories.add(cat.trim()));
      }
    });
    return ["すべて", ...Array.from(categories)];
  }, [shops]);

  if (loading) {
    return (
      <main className="flex flex-col items-center p-4 md:p-8 lg:p-12">
        <div className="w-full flex justify-end mb-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-200 h-96 animate-pulse"
            ></div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center p-4 md:p-8 lg:p-12">
      {console.log("HomePageClient: searchTerm being passed to FilterableShopList", searchTerm)} {/* Log before passing */}
      <FilterableShopList
        key={searchTerm} // Add key prop to force remount on searchTerm change
        initialShops={shops}
        initialRowCount={2}
        availableCategories={availableCategories}
        onNavigate={handleNavigate}
        headerKeyword={searchTerm}
        isSearching={isSearching}
      />
    </main>
  );
}
