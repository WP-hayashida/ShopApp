import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shop } from "@/app/(features)/_lib/types";
import { getShopById } from "@/app/(features)/_lib/shopService";
import { useAuth } from "@/context/AuthContext";
import { useLikeShop } from "@/app/(features)/_hooks/useLikeShop"; // Import useLikeShop
import { useSearch } from "@/context/SearchContext"; // Import useSearch

export const useShopDetails = (shopId: string) => {
  const { user } = useAuth();
  const { handleLikeToggle } = useLikeShop(); // Use useLikeShop hook
  const router = useRouter();
  const { triggerShopListRefresh } = useSearch(); // Use triggerShopListRefresh

  const [store, setStore] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShopData = useCallback(
    async () => {
      if (!shopId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const shopData = await getShopById(shopId);
        setStore(shopData);
      } catch (error) {
        console.error("Error fetching shop details:", error);
        setStore(null);
      } finally {
        setLoading(false);
      }
    },
    [shopId] // Remove supabase.auth from dependencies
  );

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const handleLikeToggleForDetail = async (shopId: string, initialLikedStatus: boolean) => {
    await handleLikeToggle(shopId, initialLikedStatus, (updatedShop) => {
      setStore((prevStore) => {
        if (!prevStore) return null;
        return {
          ...prevStore,
          liked: updatedShop.liked,
          likes: prevStore.likes + (updatedShop.liked ? 1 : -1),
        };
      });
      triggerShopListRefresh(); // Trigger refresh of shop list on home page
    });
  };

  const handleNavigateBack = () => {
    router.back();
  };

  return {
    store,
    loading,
    currentUserId: user?.id || null,
    handleLikeToggle: handleLikeToggleForDetail, // Use the new handler
    handleNavigateBack,
  };
};

