import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  getShopById,
  updateShop,
  deleteShop,
} from "@/app/(features)/_lib/shopService";
import { Shop, ShopPayload } from "@/app/(features)/_lib/types";
import { createClient } from "@/lib/supabase/client";

export const useShopEditor = (shopId: string) => {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Partial<Shop>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAndShop = useCallback(
    async (userId: string) => {
      try {
        const shopData = await getShopById(shopId);
        if (shopData) {
          if (shopData.user.id !== userId) {
            setError("このショップを編集する権限がありません。");
          } else {
            setShop(shopData);
          }
        } else {
          setError("ショップが見つかりません。");
        }
      } catch (err) {
        setError("ショップ情報の読み込みに失敗しました。");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [shopId]
  );

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserAndShop(currentUser.id);
        } else {
          setLoading(false);
          router.push("/auth/signin"); // Redirect if not logged in
        }
      }
    );

    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserAndShop(user.id);
      } else {
        setLoading(false);
        router.push("/auth/signin"); // Redirect if not logged in
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchUserAndShop, router]);

  const handleFormChange = (field: keyof Shop, value: any) => {
    setShop((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !shop) {
      setError("データが不十分です。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatePayload: Partial<ShopPayload> = {
        url: shop.url || null,
        comments: shop.comments || null,
        detailed_category: shop.detailed_category || null,
        photo_url: shop.imageUrl, // Use shop.imageUrl
      };

      await updateShop(shopId, updatePayload, photo);

      alert("投稿が正常に更新されました。");
      router.push("/my-page");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "投稿の更新中にエラーが発生しました。";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      alert("ユーザーが認証されていません。");
      return;
    }
    if (
      !window.confirm(
        "本当にこの投稿を削除しますか？この操作は元に戻せません。"
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteShop(shopId);
      alert("投稿が削除されました。");
      router.push("/my-page");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "投稿の削除中にエラーが発生しました。";
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    shop,
    photo,
    setPhoto,
    loading,
    error,
    handleFormChange,
    handleSubmit,
    handleDelete,
  };
};
