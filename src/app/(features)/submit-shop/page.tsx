import { User } from "@supabase/supabase-js";
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandItem, CommandList } from "cmdk";
import { Button } from "@/components/ui/button";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useShopSubmit } from "./_hooks/useShopSubmit";
import { PhotoInput } from "@/app/(features)/_components/form/PhotoInput";
import { UrlInput } from "@/app/(features)/_components/form/UrlInput";
import { DetailedCategoryInput } from "@/app/(features)/_components/form/DetailedCategoryInput";
import { CommentTextarea } from "@/app/(features)/_components/form/CommentTextarea";
import { SubmitShopInfoDisplay } from "./_components/SubmitShopInfoDisplay";
import { useAuth } from "@/context/AuthContext";
import {
  FormProvider,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"; // Import form components

function ShopNewForm({ user }: { user: User }) {
  const {
    form,
    name,
    addressInput,
    suggestions,
    photo,
    url,
    selectedCategories,
    detailedCategory,
    comments,
    autoPhotoUrl,
    rating,
    businessHours,
    isSubmitting,
    error,
    handleSuggestionSelect,
    handleSubmit,
  } = useShopSubmit(user);

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">新しいお店を投稿する</h1>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 店舗名入力フィールド */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>店舗名</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 大砲ラーメン 本店"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                {suggestions.length > 0 && ( // Display suggestions only if there are any
                  <div className="absolute z-50 w-full">
                    <Command className="bg-background border rounded-md mt-1 shadow-lg">
                      <CommandList>
                        <CommandEmpty>候補が見つかりません。</CommandEmpty>
                        {suggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion.place_id}
                            onMouseDown={(e) => e.preventDefault()}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                          >
                            {suggestion.structured_formatting?.main_text}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <SubmitShopInfoDisplay
            rating={rating}
            businessHours={businessHours}
            selectedCategories={selectedCategories}
            locationText={addressInput}
          />

          <FormField
            control={form.control}
            name="photo"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>写真</FormLabel>
                <FormControl>
                  <PhotoInput
                    initialImageUrl={autoPhotoUrl}
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
            name="detailedCategory"
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "投稿中..." : "投稿する"}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}

export default function ShopNewPageWrapper() {
  const { user, loading: loadingUser, signIn } = useAuth();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey)
    return (
      <div className="text-center py-10">APIキーが設定されていません。</div>
    );
  if (loadingUser)
    return <div className="text-center py-10">読み込み中...</div>;
  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">新しいお店を投稿する</h1>
        <p>お店を投稿するにはサインインが必要です。</p>
        <Button onClick={signIn} className="mt-4">
          Googleでサインイン
        </Button>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <ShopNewForm user={user} />
    </APIProvider>
  );
}
