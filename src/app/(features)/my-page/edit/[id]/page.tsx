"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { PhotoInput } from "@/app/(features)/_components/form/PhotoInput";
import { UrlInput } from "@/app/(features)/_components/form/UrlInput";
import { DetailedCategoryInput } from "@/app/(features)/_components/form/DetailedCategoryInput";
import { CommentTextarea } from "@/app/(features)/_components/form/CommentTextarea";
import { ShopInfoDisplay } from "@/app/(features)/_components/ShopInfoDisplay";
import { DangerZone } from "../../_components/DangerZone";
import { ArrowLeft } from "lucide-react";
import { useShopEditor } from "../_hooks/useShopEditor";

export default function EditShopPage() {
  const params = useParams();
  const shopId = params.id as string;

  const {
    shop,
    photo,
    setPhoto,
    loading,
    error,
    handleFormChange,
    handleSubmit,
    handleDelete,
  } = useShopEditor(shopId);

  const router = useRouter(); // Import useRouter here

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-10 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!shop.id) {
    return (
      <div className="container mx-auto max-w-2xl py-10 text-center">
        <p>ショップデータが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold ml-2">ショップを編集</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <ShopInfoDisplay shop={shop} />

        <PhotoInput
          initialImageUrl={shop.imageUrl || null}
          photo={photo}
          onPhotoChange={setPhoto}
        />

        <UrlInput
          value={shop.url || ""}
          onChange={(value) => handleFormChange("url", value)}
        />

        <DetailedCategoryInput
          value={shop.detailed_category || ""}
          onChange={(value) => handleFormChange("detailed_category", value)}
        />

        <CommentTextarea
          value={shop.comments || ""}
          onChange={(value) => handleFormChange("comments", value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "更新中..." : "更新する"}
        </Button>
      </form>

      <DangerZone onDelete={handleDelete} loading={loading} />
    </div>
  );
}
