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
import { FormProvider, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"; // Import form components
import { Input } from "@/components/ui/input"; // Import Input for name field

export default function EditShopPage() {
  const params = useParams();
  const shopId = params.id as string;

  const {
    form,
    shop,
    loading,
    error,
    handleDelete,
    handleSubmit,
  } = useShopEditor(shopId);

  const router = useRouter();

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
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ShopInfoDisplay is not a form field, so it remains as is */}
          <ShopInfoDisplay shop={shop} />

          {/* Name field - added for completeness, assuming it should be editable */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>店舗名</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="photo"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>写真</FormLabel>
                <FormControl>
                  <PhotoInput
                    initialImageUrl={shop.imageUrl || null}
                    photo={value}
                    onPhotoChange={onChange}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <UrlInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="detailed_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>詳細カテゴリ</FormLabel>
                <FormControl>
                  <DetailedCategoryInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>コメント</FormLabel>
                <FormControl>
                  <CommentTextarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "更新中..." : "更新する"}
          </Button>
        </form>
      </FormProvider>

      <DangerZone onDelete={handleDelete} loading={loading} />
    </div>
  );
}
