import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  getShopById,
  updateShop,
  deleteShop,
} from "@/app/(features)/_lib/shopService";
import { Shop, ShopPayload } from "@/app/(features)/_lib/types";
import { useAuth } from "@/context/AuthContext";
import { useForm, SubmitHandler } from "react-hook-form";

interface ShopFormValues {
  name: string;
  url: string;
  detailed_category: string;
  comments: string;
  imageUrl: string | null;
  photo: File | null;
}

export const useShopEditor = (shopId: string) => {
  const router = useRouter();
  const { user, supabase } = useAuth();

  const form = useForm<ShopFormValues>({
    defaultValues: {
      name: "",
      url: "",
      detailed_category: "",
      comments: "",
      imageUrl: null,
      photo: null,
    },
  });

  const { watch, setValue, handleSubmit, formState: { isSubmitting } } = form;

  const shop = watch(); // Watch all form values as the shop object
  const photo = watch("photo");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopData = useCallback(
    async (userId: string) => {
      try {
        const shopData = await getShopById(shopId);
        if (shopData) {
          if (shopData.user.id !== userId) {
            setError("このショップを編集する権限がありません。");
          } else {
            // Set form values from fetched shopData
            setValue("name", shopData.name);
            setValue("url", shopData.url);
            setValue("detailed_category", shopData.detailed_category);
            setValue("comments", shopData.comments || "");
            setValue("imageUrl", shopData.imageUrl);
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
    [shopId, setValue]
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      router.push("/auth/signin"); // Redirect if not logged in
      return;
    }
    fetchShopData(user.id);
  }, [user, fetchShopData, router]);

  const onSubmit: SubmitHandler<ShopFormValues> = async (values) => {
    if (!user) {
      setError("ユーザーが認証されていません。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalPhotoUrl: string | null = values.imageUrl;
      if (values.photo) {
        const fileExt = values.photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, values.photo);
        if (uploadError)
          throw new Error(`写真のアップロードに失敗: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage
          .from("shop-photos")
          .getPublicUrl(uploadData.path);
        finalPhotoUrl = publicUrlData.publicUrl;
      }

      const updatePayload: Partial<ShopPayload> = {
        name: values.name,
        url: values.url || null,
        comments: values.comments || null,
        detailed_category: values.detailed_category || null,
        photo_url: finalPhotoUrl, // Use finalPhotoUrl
      };

      await updateShop(shopId, updatePayload, values.photo);

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
    form,
    shop: shop as Partial<Shop>, // Cast to Partial<Shop> for ShopInfoDisplay
    photo,
    setPhoto: (file: File | null) => setValue("photo", file),
    loading,
    error,
    handleFormChange: (field: keyof ShopFormValues, value: ShopFormValues[keyof ShopFormValues]) => setValue(field, value),
    handleSubmit: handleSubmit(onSubmit),
    handleDelete,
  };
};
