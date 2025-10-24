"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shop } from "../_lib/types";

interface UseLikeShopResult {
  isLiking: boolean;
  handleLikeToggle: (
    shopId: string,
    initialLikedStatus: boolean,
    onUpdate?: (shop: Shop) => void
  ) => Promise<void>;
}

export const useLikeShop = (): UseLikeShopResult => {
  const { user, supabase } = useAuth();
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeToggle = useCallback(
    async (
      shopId: string,
      initialLikedStatus: boolean,
      onUpdate?: (shop: Shop) => void
    ) => {
      if (!user) {
        alert("いいねするにはログインしてください。");
        return;
      }

      setIsLiking(true);
      const newLikedStatus = !initialLikedStatus;

      try {
        if (newLikedStatus) {
          const { error } = await supabase.from("likes").insert({
            user_id: user.id,
            shop_id: shopId,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("likes")
            .delete()
            .eq("user_id", user.id)
            .eq("shop_id", shopId);
          if (error) throw error;
        }

        // Call onUpdate callback if provided, to update parent component's state
        if (onUpdate) {
          onUpdate({
            id: shopId,
            liked: newLikedStatus,
            likes: initialLikedStatus ? -1 : 1, // Adjust likes count based on status
          } as Shop); // Cast to Partial<Shop> or similar if only partial data is passed
        }
      } catch (error: unknown) {
        console.error("Error toggling like:", error);
        // Revert optimistic update if there's an error (handled by onUpdate callback in parent)
        alert("いいねの更新に失敗しました。");
      } finally {
        setIsLiking(false);
      }
    },
    [user, supabase]
  );

  return {
    isLiking,
    handleLikeToggle,
  };
};
