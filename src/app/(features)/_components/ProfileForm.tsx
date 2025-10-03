'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  initialUsername?: string;
  initialAvatarUrl?: string | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialUsername, initialAvatarUrl }) => {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername || '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('ユーザーが認証されていません。');
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username: username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' } // Update if id exists, insert if not
      );

    if (dbError) {
      console.error('Error saving profile:', dbError);
      setError('プロフィールの保存に失敗しました: ' + dbError.message);
    } else {
      setSuccess('プロフィールが保存されました！');
      // Optionally refresh the page to show updated header info
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
        {loading ? '保存中...' : 'プロフィールを保存'}
      </Button>
    </form>
  );
};