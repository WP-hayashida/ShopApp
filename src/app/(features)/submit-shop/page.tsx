"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { ShopPayload } from "../_lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react";
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

/**
 * オートコンプリートの予測結果の型定義
 */
interface AutocompletePrediction {
  description: string; // 表示される地名
  place_id: string; // Google Places APIで場所の詳細を取得するためのID
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
  const [startTime, setStartTime] = useState(""); // 営業時間（開始）
  const [endTime, setEndTime] = useState(""); // 営業時間（終了）
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // 選択されたカテゴリ
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false); // カテゴリ選択ポップオーバーの開閉状態
  const [autocompletePopoverOpen, setAutocompletePopoverOpen] = useState(false); // オートコンプリートポップオーバーの開閉状態
  const [detailedCategory, setDetailedCategory] = useState(""); // 詳細カテゴリ
  const [comments, setComments] = useState(""); // コメント
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
    // 検索時と保存時のデータを一致させるため、サジェストの文字列を場所(address)として設定
    setAddressInput(suggestion.description);
    setSuggestions([]);
    setAutocompletePopoverOpen(false); // Popoverを閉じる

    // 詳細情報（正確な名前、緯度経度）を取得
    console.log(`Fetching details for placeId: "${suggestion.place_id}"`);
    try {
      // Next.jsのAPIルート経由でGoogle Places API Place Detailsを呼び出す
      const response = await fetch(
        `/placedetails?placeId=${suggestion.place_id}`
      );
      const data = await response.json();
      console.log("Received place details:", data);

      if (data.place) {
        // 店舗名は詳細情報から取得した、より正確なもので上書き
        setName(
          data.place.displayName.text || suggestion.description.split(",")[0]
        );
        setLatitude(data.place.location?.latitude || null);
        setLongitude(data.place.location?.longitude || null);
      } else {
        // 詳細取得に失敗した場合は、サジェストの文字列から店名を推測
        setName(suggestion.description.split(",")[0]);
      }
    } catch (err) {
      console.error("Place details fetch error:", err);
      setName(suggestion.description.split(",")[0]); // エラー時も同様
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
      let photoUrl: string | null = null;
      // 写真が選択されていればSupabase Storageにアップロード
      if (photo) {
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
        photoUrl = publicUrlData.publicUrl;
      }
      const businessHours =
        startTime && endTime ? `${startTime} - ${endTime}` : null;

      // 緯度・経度があれば、最寄り駅と徒歩時間を計算するAPIを呼び出す
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

      // Supabaseに挿入するデータペイロードの構築
      const shopPayload: ShopPayload = {
        name,
        photo_url: photoUrl,
        url: url || null,
        business_hours: businessHours,
        location: addressInput || null, // 検索と一致させるため、オートコンプリートのdescriptionを保存
        latitude,
        longitude,
        category: selectedCategories.length > 0 ? selectedCategories : null,
        detailed_category: detailedCategory || null,
        comments: comments || null,
        nearest_station_name: nearestStationName,
        walk_time_from_station: walkTimeFromStation,
      };
      // Supabaseの'shops'テーブルにデータを挿入
      const { error: insertError } = await supabase
        .from("shops")
        .insert({ ...shopPayload, user_id: user.id });
      if (insertError)
        throw new Error(`投稿の保存に失敗: ${insertError.message}`);
      alert("投稿が完了しました！");
      router.push("/"); // 投稿完了後、トップページへ遷移
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
          <Popover open={autocompletePopoverOpen} onOpenChange={setAutocompletePopoverOpen}>
            <PopoverTrigger asChild>
              {/* This is a dummy trigger, the Input above acts as the visual trigger */}
              <div />
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command className="relative z-10 w-full bg-background border rounded-md mt-1 shadow-lg">
                <CommandList>
                  <CommandEmpty>候補が見つかりません。</CommandEmpty>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.place_id}
                      onMouseDown={(e) => e.preventDefault()} // Popoverが閉じるのを防ぐ
                      onSelect={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion.description}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
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
        {/* 写真アップロードフィールド */}
        <div className="space-y-2">
          <Label htmlFor="photo">写真</Label>
          <Input
            id="photo"
            type="file"
            onChange={(e) =>
              setPhoto(e.target.files ? e.target.files[0] : null)
            }
            accept="image/*"
          />
        </div>
        {/* URL入力フィールド */}
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
        {/* 営業時間入力フィールド */}
        <div className="space-y-2">
          <Label>営業時間</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <span>-</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        {/* カテゴリ選択フィールド */}
        <div className="space-y-2">
          <Label htmlFor="categories">カテゴリ</Label>
          <Popover
            open={categoryPopoverOpen}
            onOpenChange={setCategoryPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-start text-left h-auto"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-wrap gap-1 py-1">
                    {selectedCategories.length > 0 ? (
                      selectedCategories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {cat}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        カテゴリを選択
                      </span>
                    )}
                  </div>
                  <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="カテゴリを検索..." />
                <CommandEmpty>カテゴリが見つかりません。</CommandEmpty>
                <CommandGroup>
                  {predefinedCategories.map((cat) => (
                    <CommandItem
                      key={cat}
                      onSelect={() =>
                        setSelectedCategories((prev) =>
                          prev.includes(cat)
                            ? prev.filter((c) => c !== cat)
                            : [...prev, cat]
                        )
                      }
                    >
                      <Checkbox
                        checked={selectedCategories.includes(cat)}
                        className="mr-2"
                      />
                      {cat}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
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
