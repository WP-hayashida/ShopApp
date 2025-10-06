'use client';

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
import { Shop } from "@/app/(features)/_lib/types";

const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const categories = [
  "カフェ", "レストラン", "ラーメン", "バー", "居酒屋", "焼肉", "寿司",
  "パン屋", "スイーツ", "雑貨屋", "書店", "アパレル", "美容室", "その他"
];

export default function EditShopPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState(prefectures[12]); // Default to Tokyo
  const [category, setCategory] = useState("");
  const [detailedCategory, setDetailedCategory] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUserAndShop = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoadingUser(false);
        return;
      }

      // Fetch existing shop data
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

      // Pre-fill form with existing data
      setName(shopData.name ?? "");
      setInitialPhotoUrl(shopData.photo_url);
      setUrl(shopData.url ?? "");
      if (shopData.business_hours) {
        const [start, end] = shopData.business_hours.split(" - ");
        setStartTime(start || "");
        setEndTime(end || "");
      }
      setLocation(shopData.location ?? prefectures[12]);
      setCategory(shopData.category ?? "");
      setDetailedCategory(shopData.detailed_category ?? "");
      setComments(shopData.comments ?? "");

      setLoadingUser(false);
    };
    getUserAndShop();
  }, [supabase, shopId]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setError("ユーザーが認証されていません。再度サインインしてください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoUrl: string | null = initialPhotoUrl;

      if (photo) {
        // If a new photo is selected, upload it
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, photo);

        if (uploadError) {
          throw new Error(
            `写真のアップロードに失敗しました: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from('shop-photos')
          .getPublicUrl(uploadData.path);
        photoUrl = publicUrlData.publicUrl;
      }

      const businessHours =
        startTime && endTime ? `${startTime} - ${endTime}` : "";
      const shopData = {
        name,
        photo_url: photoUrl,
        url,
        business_hours: businessHours,
        location,
        category,
        detailed_category: detailedCategory,
        comments,
      };

      const { error: updateError } = await supabase
        .from('shops')
        .update(shopData)
        .eq('id', shopId);

      if (updateError) {
        throw new Error(`投稿の更新に失敗しました: ${updateError.message}`);
      }

    } catch (err) {
      let message = '投稿の更新中にエラーが発生しました。';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="container mx-auto max-w-2xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

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

  const handleDelete = async () => {
    if (!user) {
      alert("ユーザーが認証されていません。");
      return;
    }
    if (!window.confirm("本当にこの投稿を削除しますか？この操作は元に戻せません。")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (deleteError) {
        throw new Error(`投稿の削除に失敗しました: ${deleteError.message}`);
      }

      alert("投稿が削除されました。");
      router.push("/my-page");
    } catch (err) {
      let message = '投稿の削除中にエラーが発生しました。';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-6">ショップを編集</h1>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
        {/* Form inputs... */}
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
        <div className="space-y-2">
          <Label htmlFor="photo">写真</Label>
          {initialPhotoUrl && !photo && (
            <div className="relative w-32 h-32 mb-2">
              <img src={initialPhotoUrl} alt="Current Shop Photo" className="w-full h-full object-cover rounded-md" />
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
        <div className="space-y-2">
          <Label htmlFor="location">場所</Label>
          <Select onValueChange={setLocation} value={location}>
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
        <div className="space-y-2">
          <Label htmlFor="detailedCategory">詳細カテゴリ</Label>
          <Input
            id="detailedCategory"
            value={detailedCategory}
            onChange={(e) => setDetailedCategory(e.target.value)}
            placeholder="例: スペシャルティコーヒー"
          />
        </div>
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
          {loading ? '更新中...' : '更新する'}
        </Button>
      </form>

      <Separator className="my-8" />

      <section>
        <h2 className="text-2xl font-bold text-red-600 mb-4">危険な操作</h2>
        <p className="text-gray-700 mb-4">このショップの投稿を完全に削除します。この操作は元に戻せません。</p>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? '削除中...' : '投稿を削除する'}
        </Button>
      </section>
    </div>
  );
}
