"use client";

import { User } from "@supabase/supabase-js";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandItem, CommandList } from "cmdk";
import { Button } from "@/components/ui/button";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useShopSubmit } from "./_hooks/useShopSubmit";
import { PhotoInput } from "@/app/(features)/_components/form/PhotoInput";
import { UrlInput } from "@/app/(features)/_components/form/UrlInput";
import { DetailedCategoryInput } from "@/app/(features)/_components/form/DetailedCategoryInput";
import { CommentTextarea } from "@/app/(features)/_components/form/CommentTextarea";
import { SubmitShopInfoDisplay } from "../_components/SubmitShopInfoDisplay";

function ShopNewForm({ user }: { user: User }) {
  const {
    name,
    setName,
    addressInput,
    setAddressInput,
    suggestions,
    photo,
    setPhoto,
    url,
    setUrl,
    selectedCategories,
    detailedCategory,
    setDetailedCategory,
    comments,
    setComments,
    autoPhotoUrl,
    rating,
    businessHours,
    loading,
    error,
    handleSuggestionSelect,
    handleSubmit,
  } = useShopSubmit(user);

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">新しいお店を投稿する</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 店舗名入力フィールド */}
        <div className="space-y-2 relative">
          <Label htmlFor="name">店舗名</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 大砲ラーメン 本店"
            autoComplete="off"
            required
          />
          {suggestions.length > 0 && (
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
        </div>

        <SubmitShopInfoDisplay
            rating={rating}
            businessHours={businessHours}
            selectedCategories={selectedCategories}
            locationText={addressInput}
        />

        <PhotoInput
            initialImageUrl={autoPhotoUrl}
            photo={photo}
            onPhotoChange={setPhoto}
        />

        <UrlInput value={url} onChange={setUrl} />

        <DetailedCategoryInput value={detailedCategory} onChange={setDetailedCategory} />
        
        <CommentTextarea value={comments} onChange={setComments} />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}

export default function ShopNewPageWrapper() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoadingUser(false);
    };
    getUser();
  }, [supabase.auth]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

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
        <Button onClick={handleSignIn} className="mt-4">
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
