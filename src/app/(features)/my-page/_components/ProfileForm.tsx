"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// ProfileFormコンポーネントのプロパティ型定義
interface ProfileFormProps {
  initialUsername?: string; // 初期のユーザー名
  initialAvatarUrl?: string | null; // 初期のアバターURL
}

/**
 * ユーザープロフィールを編集・更新するためのフォームコンポーネント
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialUsername,
  initialAvatarUrl,
}) => {
  const supabase = createClient();
  const router = useRouter();
  // ステート変数の定義
  const [username, setUsername] = useState(initialUsername || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // フォームの送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("ユーザーが認証されていません。");
      setLoading(false);
      return;
    }

    // プロフィール情報を更新または挿入（upsert）
    const { error: dbError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username: username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" } // idが競合した場合は更新
    );

    if (dbError) {
      console.error("Error saving profile:", dbError);
      setError("プロフィールの保存に失敗しました: " + dbError.message);
    } else {
      setSuccess("プロフィールが保存されました！");
      // ヘッダーなどの情報を更新するためにページをリフレッシュ
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <div className="space-y-2">
        <Label htmlFor="username">ニックネーム</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ニックネームを入力"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatarUrl">アバターURL</Label>
        <Input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="アバター画像のURL"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "プロフィールを保存"}
      </Button>
    </form>
  );
};
