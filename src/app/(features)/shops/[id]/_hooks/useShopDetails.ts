import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shop } from "@/app/(features)/_lib/types";
import { getShopById } from "@/app/(features)/_lib/shopService";

export const useShopDetails = (shopId: string) => {
  const supabase = createClient();
  const router = useRouter();

  const [store, setStore] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchShopData = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setCurrentUserId(currentUser?.id || null);

      const shopData = await getShopById(shopId); // Use the existing shopService function
      setStore(shopData);
    } catch (error) {
      console.error("Error fetching shop details:", error);
      setStore(null); // Ensure store is null on error
    } finally {
      setLoading(false);
    }
  }, [shopId, supabase.auth]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const handleLikeToggle = async (shopId: string, newLikedStatus: boolean) => {
    if (!currentUserId) {
      alert("いいねするにはログインしてください。");
      return;
    }

    // Optimistically update the UI
    setStore((prevStore) => {
      if (!prevStore) return null;
      return {
        ...prevStore,
        likes: newLikedStatus ? prevStore.likes + 1 : prevStore.likes - 1,
        liked: newLikedStatus,
      };
    });

    try {
      if (newLikedStatus) {
        const { error } = await supabase.from("likes").insert({
          user_id: currentUserId,
          shop_id: shopId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("shop_id", shopId);
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      // Revert optimistic update if there's an error
      setStore((prevStore) => {
        if (!prevStore) return null;
        return {
          ...prevStore,
          likes: newLikedStatus ? prevStore.likes - 1 : prevStore.likes + 1,
          liked: !newLikedStatus,
        };
      });
      if (error.code === "23505") {
        console.warn("User already liked this shop (duplicate key error).");
      }
    }
  };

  const handleNavigateBack = () => {
    router.back();
  };

  return {
    store,
    loading,
    currentUserId,
    handleLikeToggle,
    handleNavigateBack,
  };
};
