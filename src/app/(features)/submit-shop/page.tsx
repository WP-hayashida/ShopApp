"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
 * 新しいお店を投稿するページコンポーネント
 */
export default function ShopNewPage() {
  const supabase = createClient();
  const router = useRouter();
  // ステート変数の定義
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // フォームの各フィールドのステート
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState(prefectures[12]); // デフォルトを東京に設定
  const [category, setCategory] = useState("");
  const [detailedCategory, setDetailedCategory] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 副作用フック：ユーザー情報を取得
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoadingUser(false);
    };
    getUser();
  }, [supabase.auth]);

  // サインイン処理
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const {
      data: { user: submitUser },
    } = await supabase.auth.getUser();

    if (!submitUser) {
      setError("ユーザーが認証されていません。再度サインインしてください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoUrl: string | null = null;

      // 写真が選択されている場合、Supabase Storageにアップロード
      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${submitUser.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, photo);

        if (uploadError) {
          throw new Error(
            `写真のアップロードに失敗しました: ${uploadError.message}`
          );
        }

        // アップロードした写真の公開URLを取得
        const { data: publicUrlData } = supabase.storage
          .from("shop-photos")
          .getPublicUrl(uploadData.path);
        photoUrl = publicUrlData.publicUrl;
      }

      // 営業時間を整形
      const businessHours =
        startTime && endTime ? `${startTime} - ${endTime}` : "";
      
      // データベースに保存する店舗データを作成
      const shopData = {
        user_id: submitUser.id,
        name,
        photo_url: photoUrl,
        url,
        business_hours: businessHours,
        location,
        category,
        detailed_category: detailedCategory,
        comments,
      };

      // `shops`テーブルにデータを挿入
      const { error: insertError } = await supabase
        .from("shops")
        .insert(shopData);

      if (insertError) {
        throw new Error(`投稿の保存に失敗しました: ${insertError.message}`);
      }

      alert("投稿が完了しました！");
      router.push("/"); // ホームページにリダイレクト
    } catch (err) {
      let message = "投稿中にエラーが発生しました。";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 入力フィールドでEnterキーが押されたときにフォームが送信されるのを防ぐ
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
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
        <h1 className="text-3xl font-bold mb-4">新しいお店を投稿する</h1>
        <p>お店を投稿するにはサインインが必要です。</p>
        <Button onClick={handleSignIn} className="mt-4">
          Googleでサインイン
        </Button>
      </div>
    );
  }

  // メインのフォーム表示
  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-6">新しいお店を投稿する</h1>
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
            placeholder="例: 大砲ラーメン 本店"
            required
          />
        </div>
        {/* 写真 */}
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
        {/* 営業時間 */}
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
        {/* 場所 */}
        <div className="space-y-2">
          <Label htmlFor="location">場所</Label>
          <Select onValueChange={setLocation} defaultValue={location}>
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
          <Select onValueChange={setCategory} value={category}>
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
          {loading ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}
