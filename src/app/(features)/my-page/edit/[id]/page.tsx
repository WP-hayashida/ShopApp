"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import Image from "next/image";

import type { Json } from "@/lib/database.types";



// Define a type for the structured business hours

interface BusinessHours {

  day: string;

  time: string;

}



// 定数：都道府県リスト
const prefectures = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

// 定数：カテゴリリスト
const categories = [
  "カフェ",
  "レストラン",
  "ラーメン",
  "バー",
  "居酒屋",
  "焼肉",
  "寿司",
  "パン屋",
  "スイーツ",
  "雑貨屋",
  "書店",
  "アパレル",
  "美容室",
  "その他",
];

/**
 * 投稿したお店の情報を編集するページコンポーネント
 */
export default function EditShopPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string; // URLから店舗IDを取得

  // ステート変数の定義
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string | null>(null);

  // Individual state for each form field
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState(prefectures[12]);
  const [category, setCategory] = useState("");
  const [detailedCategory, setDetailedCategory] = useState("");
  const [comments, setComments] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHours[] | null>(null);
  const [rating, setRating] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 副作用フック：ユーザーと既存の店舗情報を取得してフォームに設定
  useEffect(() => {
    const getUserAndShop = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoadingUser(false);
        return;
      }

      // 既存の店舗データを取得
      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single();

      if (fetchError || !shopData) {
        console.error("Error fetching shop for edit:", fetchError);
        setError("ショップ情報の読み込みに失敗しました。");
        setLoadingUser(false);
        return;
      }

      // フォームに既存のデータを設定
      setName(shopData.name ?? "");
      setUrl(shopData.url ?? "");
      setLocation(shopData.location ?? prefectures[12]);
      setCategory(shopData.category?.[0] ?? "");
      setDetailedCategory(shopData.detailed_category ?? "");
      setComments(shopData.comments ?? "");
      setInitialPhotoUrl(shopData.photo_url);
      setBusinessHours(shopData.business_hours_weekly as BusinessHours[] | null);
      setRating(shopData.rating ?? null);

      setLoadingUser(false);
    };
    getUserAndShop();
  }, [supabase, shopId]);

  // サインイン処理
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // 入力フィールドでEnterキーが押されたときにフォームが送信されるのを防ぐ
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
    }
  };

  // フォーム送信（更新）処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setError("ユーザーが認証されていません。再度サインインしてください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let updatedPhotoUrl: string | null = initialPhotoUrl;

      // 新しい写真が選択された場合、アップロード処理を行う
      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, photo);

        if (uploadError) {
          throw new Error(
            `写真のアップロードに失敗しました: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("shop-photos")
          .getPublicUrl(uploadData.path);
        updatedPhotoUrl = publicUrlData.publicUrl;
      }

      // Supabaseに送信するデータを作成
      const updatePayload = {
        name,
        photo_url: updatedPhotoUrl,
        url: url || null,
        location: location || null,
        category: category ? [category] : null,
        detailed_category: detailedCategory || null,
        comments: comments || null,
        business_hours_weekly: businessHours as unknown as Json,
        rating: rating,
      };

      // `shops`テーブルのデータを更新
      const { error: updateError } = await supabase
        .from("shops")
        .update(updatePayload)
        .eq("id", shopId);

      if (updateError) {
        throw new Error(`投稿の更新に失敗しました: ${updateError.message}`);
      }
      alert("投稿が正常に更新されました。");
      router.push("/my-page");
    } catch (err) {
      let message = "投稿の更新中にエラーが発生しました。";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ユーザー情報読み込み中の表示
  if (loadingUser) {
    return (
      <div className="container mx-auto max-w-2xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未ログイン時の表示
  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">ショップを編集</h1>
        <p>このページを表示するにはサインインが必要です。</p>
        <Button onClick={handleSignIn} className="mt-4">
          Googleでサインイン
        </Button>
      </div>
    );
  }

  // 投稿の削除処理
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
      const { error: deleteError } = await supabase
        .from("shops")
        .delete()
        .eq("id", shopId);

      if (deleteError) {
        throw new Error(`投稿の削除に失敗しました: ${deleteError.message}`);
      }

      alert("投稿が削除されました。");
      router.push("/my-page"); // マイページにリダイレクト
    } catch (err) {
      let message = "投稿の削除中にエラーが発生しました。";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // メインのフォーム表示
  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-6">ショップを編集</h1>
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-6"
      >
        {/* 店舗名 */}
        <div className="space-y-2">
          <Label htmlFor="name">店舗名</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: Geminiカフェ"
            required
          />
        </div>
        {/* 写真 */}
        <div className="space-y-2">
          <Label htmlFor="photo">写真</Label>
          {initialPhotoUrl && !photo && (
            <div className="relative w-32 h-32 mb-2">
              <Image
                src={initialPhotoUrl}
                alt="Current Shop Photo"
                fill
                className="object-cover rounded-md"
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
              営業時間のデータがありません。
            </div>
          )}
        </div>

        {/* URL */}
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

        {/* 場所 */}
        <div className="space-y-2">
          <Label htmlFor="location">場所</Label>
          <Select
            onValueChange={(value) => setLocation(value)}
            value={location}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="都道府県を選択" />
            </SelectTrigger>
            <SelectContent>
              {prefectures.map((pref) => (
                <SelectItem key={pref} value={pref}>
                  {pref}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* カテゴリ */}
        <div className="space-y-2">
          <Label htmlFor="category">カテゴリ</Label>
          <Select
            onValueChange={(value) => setCategory(value)}
            value={category}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* 詳細カテゴリ */}
        <div className="space-y-2">
          <Label htmlFor="detailedCategory">詳細カテゴリ</Label>
          <Input
            id="detailedCategory"
            value={detailedCategory}
            onChange={(e) => setDetailedCategory(e.target.value)}
            placeholder="例: スペシャルティコーヒー"
          />
        </div>
        {/* コメント */}
        <div className="space-y-2">
          <Label htmlFor="comments">コメント</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="お店の雰囲気やおすすめメニューなどを記入してください"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "更新中..." : "更新する"}
        </Button>
      </form>

      <Separator className="my-8" />

      {/* 危険な操作ゾーン */}
      <section>
        <h2 className="text-2xl font-bold text-red-600 mb-4">危険な操作</h2>
        <p className="text-gray-700 mb-4">
          このショップの投稿を完全に削除します。この操作は元に戻せません。
        </p>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? "削除中..." : "投稿を削除する"}
        </Button>
      </section>
    </div>
  );
}
