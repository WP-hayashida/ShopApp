"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useMemo } from "react";
import Image from "next/image"; // Added Image import
import { ShopPayload } from "../_lib/types";
import type { Json } from "@/lib/database.types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { APIProvider } from "@vis.gl/react-google-maps";
import { categories as predefinedCategories } from "@/config/categories";

import { googleTypeToJapaneseMap } from "@/lib/googleMapsTypes";

/**
 * オートコンプリートの予測結果の型定義
 */
interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * 新しいお店を投稿するためのフォームコンポーネント
 * @param user - 現在ログインしているユーザー情報
 */
function ShopNewForm({ user }: { user: User }) {
  const supabase = useMemo(() => createClient(), []); // awaitを削除し、useMemoで初期化
  const router = useRouter();

  // フォームの各入力フィールドに対応するstate
  const [name, setName] = useState(""); // 店舗名
  const [addressInput, setAddressInput] = useState(""); // 場所入力フィールドのテキスト（検索と保存に利用）
  const [latitude, setLatitude] = useState<number | null>(null); // 店舗の緯度
  const [longitude, setLongitude] = useState<number | null>(null); // 店舗の経度
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]); // オートコンプリートの候補リスト
  const [photo, setPhoto] = useState<File | null>(null); // 投稿する写真ファイル
  const [url, setUrl] = useState(""); // 店舗のウェブサイトURL
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // 選択されたカテゴリ
  const [autocompletePopoverOpen, setAutocompletePopoverOpen] = useState(false); // オートコンプリートポップオーバーの開閉状態
  const [detailedCategory, setDetailedCategory] = useState(""); // 詳細カテゴリ
  const [comments, setComments] = useState(""); // コメント
  const [placeId, setPlaceId] = useState<string | null>(null); // Google Places Place ID
  const [autoPhotoUrl, setAutoPhotoUrl] = useState<string | null>(null); // Automatically acquired photo URL
  const [rating, setRating] = useState<number | null>(null); // Rating from Google Places
  const [businessHours, setBusinessHours] = useState<
    { day: string; time: string }[] | null
  >(null); // Weekly business hours
  const [loading, setLoading] = useState(false); // フォーム送信中のローディング状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  /**
   * 店舗名入力時のオートコンプリート処理
   * name stateの変更を監視し、Google Places Autocomplete APIを呼び出す
   */
  useEffect(() => {
    if (name.length < 2) {
      setSuggestions([]);
      setAutocompletePopoverOpen(false); // Popoverを閉じる
      return;
    }

    // 入力遅延のためのタイマー（API呼び出しの頻度を抑える）
    const handler = setTimeout(async () => {
      console.log(`Fetching suggestions for: "${name}"`);
      try {
        // Next.jsのAPIルート経由でGoogle Places Autocomplete APIを呼び出す
        const response = await fetch(`/api/autocomplete?input=${name}`);
        const data = await response.json();
        console.log("Received data from API:", data);

        if (data.predictions && data.predictions.length > 0) {
          setSuggestions(data.predictions);
          setAutocompletePopoverOpen(true); // Popoverを開く
        } else {
          setSuggestions([]);
          setAutocompletePopoverOpen(false); // Popoverを閉じる
        }
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setAutocompletePopoverOpen(false); // エラー時もPopoverを閉じる
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [name]);

  /**
   * オートコンプリート候補選択時の処理
   * 選択された場所の詳細情報をGoogle Places APIから取得し、フォームに反映する
   */
  const handleSuggestionSelect = async (suggestion: AutocompletePrediction) => {
    setName(suggestion.structured_formatting.main_text);
    setAddressInput(suggestion.structured_formatting.secondary_text);
    setSuggestions([]);
    setAutocompletePopoverOpen(false);
    setPlaceId(suggestion.place_id); // Store place_id

    console.log(`Fetching details for placeId: "${suggestion.place_id}"`);
    try {
      // Call our hybrid API route to get comprehensive details
      const response = await fetch(
        `/api/placedetails?place_id=${suggestion.place_id}`
      );
      const data = await response.json();
      console.log("Received place details from hybrid API:", data);

      if (data) {
        setName(data.name || suggestion.structured_formatting.main_text);
        setLatitude(data.latitude || null); // Assuming API returns latitude/longitude
        setLongitude(data.longitude || null); // Assuming API returns latitude/longitude
        setAutoPhotoUrl(data.photo_url_api || null); // Set auto-acquired photo URL
        setRating(data.rating || null); // Set rating
        setBusinessHours(data.business_hours_weekly || null); // Set business hours

        // Process categories from API (assuming 'types' or similar is returned)
        if (data.types && Array.isArray(data.types)) {
          const translatedCategories = data.types.map(
            (type: string) => googleTypeToJapaneseMap[type] || type // Translate, or use original English if not found
          );
          setSelectedCategories(translatedCategories);
        } else {
          setSelectedCategories([]); // Set to empty array if no types are returned
        }
      } else {
        setName(suggestion.structured_formatting.main_text);
      }
    } catch (err) {
      console.error("Place details fetch error:", err);
      setName(suggestion.structured_formatting.main_text);
    }
  };

  /**
   * フォーム送信時の処理
   * 写真のアップロード、最寄り駅の計算、Supabaseへのデータ挿入を行う
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let finalPhotoUrl: string | null = null;
      if (photo) {
        // User uploaded a photo, prioritize it
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, photo);
        if (uploadError)
          throw new Error(`写真のアップロードに失敗: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage
          .from("shop-photos")
          .getPublicUrl(uploadData.path);
        finalPhotoUrl = publicUrlData.publicUrl;
      } else if (autoPhotoUrl) {
        // No user upload, use auto-acquired photo
        finalPhotoUrl = autoPhotoUrl;
      }

      let nearestStationName: string | null = null;
      let walkTimeFromStation: number | null = null;
      if (latitude && longitude) {
        try {
          const walkTimeResponse = await fetch(
            `/api/walk-time?lat=${latitude}&lng=${longitude}`
          );
          if (walkTimeResponse.ok) {
            const walkTimeData = await walkTimeResponse.json();
            nearestStationName = walkTimeData.stationName;
            walkTimeFromStation = walkTimeData.walkTime;
          } else {
            console.warn(
              "Could not fetch walking time:",
              await walkTimeResponse.text()
            );
          }
        } catch (walkError) {
          console.error("Error fetching walking time:", walkError);
        }
      }

      const shopPayload: ShopPayload = {
        name,
        photo_url: finalPhotoUrl, // Use finalPhotoUrl
        url: url || null,
        business_hours_weekly: businessHours as unknown as Json, // Cast to Json for Supabase
        rating: rating,
        location: addressInput || null,
        latitude,
        longitude,
        category: selectedCategories.length > 0 ? selectedCategories : null,
        detailed_category: detailedCategory || null,
        comments: comments || null,
        nearest_station_name: nearestStationName,
        walk_time_from_station: walkTimeFromStation,
        place_id: placeId, // Save place_id
      };
      const { error: insertError } = await supabase
        .from("shops")
        .insert({ ...shopPayload, user_id: user.id });
      if (insertError)
        throw new Error(`投稿の保存に失敗: ${insertError.message}`);
      alert("投稿が完了しました！");
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "投稿中にエラーが発生しました。";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
          {/* オートコンプリート候補表示 */}
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full">
              <Command className="bg-background border rounded-md mt-1 shadow-lg">
                <CommandList>
                  <CommandEmpty>候補が見つかりません。</CommandEmpty>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.place_id}
                      onMouseDown={(e) => e.preventDefault()} // onBlurが先に発火するのを防ぐ
                      onSelect={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion.structured_formatting?.main_text}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </div>
          )}{" "}
        </div>{" "}
        {/* 場所入力フィールド */}
        <div className="space-y-2">
          <Label htmlFor="addressInput">場所</Label>
          <Input
            id="addressInput"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="店舗名を検索するか、手動で住所を入力してください"
            required
          />
        </div>
        {/* Rating Display */}
        {rating && (
          <div className="space-y-2">
            <Label htmlFor="rating">評価</Label>
            <div className="flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="font-bold text-lg">{rating}</span>
            </div>
          </div>
        )}
        {/* Photo Upload */}
        <div className="space-y-2">
          <Label htmlFor="photo">写真</Label>
          {autoPhotoUrl &&
            !photo && ( // Display auto-acquired photo if no user photo
              <div className="relative w-32 h-32 mb-2">
                <Image
                  src={autoPhotoUrl}
                  alt="自動取得された写真"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            )}
          <Input
            id="photo"
            type="file"
            onChange={(e) =>
              setPhoto(e.target.files ? e.target.files[0] : null)
            }
            accept="image/*"
          />
        </div>
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        {/* Business Hours Display */}
        <div className="space-y-2">
          <Label>営業時間</Label>
          {businessHours && businessHours.length > 0 ? (
            <div className="p-4 border rounded-md bg-muted/50 text-sm">
              <ul>
                {businessHours.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.day}</span>
                    <span>{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-4 border rounded-md">
              店舗を検索すると営業時間が自動入力されます。
            </div>
          )}
        </div>
        {/* カテゴリ表示フィールド */}
        <div className="space-y-2">
          <Label htmlFor="categories">カテゴリ</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.length > 0 ? (
              selectedCategories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                店舗を検索するとカテゴリが自動入力されます。
              </p>
            )}
          </div>
        </div>
        {/* 詳細カテゴリ入力フィールド */}
        <div className="space-y-2">
          <Label htmlFor="detailedCategory">詳細カテゴリ</Label>
          <Input
            id="detailedCategory"
            value={detailedCategory}
            onChange={(e) => setDetailedCategory(e.target.value)}
            placeholder="例: スペシャルティコーヒー, 豚骨ラーメン"
          />
        </div>
        {/* コメント入力フィールド */}
        <div className="space-y-2">
          <Label htmlFor="comments">コメント</Label>
          <Input
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="お店の雰囲気やおすすめメニューなど"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}

/**
 * 新しいお店投稿ページのラッパーコンポーネント
 * ユーザー認証状態の管理とGoogle Maps API Providerの提供を行う
 */
export default function ShopNewPageWrapper() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null); // ログインユーザー情報
  const [loadingUser, setLoadingUser] = useState(true); // ユーザー情報ロード中の状態

  // ユーザー認証状態の取得
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoadingUser(false);
    };
    getUser();
  }, [supabase.auth]);

  // Googleサインイン処理
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // Google Maps APIキーのチェック
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
    // Google Maps API ProviderでAPIキーを提供
    <APIProvider apiKey={apiKey}>
      <ShopNewForm user={user} />
    </APIProvider>
  );
}
