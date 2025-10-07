'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

/**
 * ヘッダーコンポーネント
 * ナビゲーションリンクと認証状態に応じた表示（サインイン/サインアウトボタン）を提供します。
 */
const Header: React.FC = () => {
  // ステート変数の定義
  const [user, setUser] = useState<User | null>(null); // ログインユーザー情報
  const [loading, setLoading] = useState(true); // ローディング状態
  const supabase = useMemo(() => createClient(), []); // Supabaseクライアントをメモ化

  // 副作用フック：ユーザー情報を取得し、認証状態の変更を監視
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // 認証状態の変更を監視するリスナーを設定
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // クリーンアップ関数：リスナーを解除
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]); // supabaseのインスタンスが変わった時のみ再実行

  // サインイン処理
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // サインアウト処理
  const handleSignOut = async () => {
    if (window.confirm('本当にサインアウトしますか？')) {
      await supabase.auth.signOut();
      // サインアウト状態を反映するためにページをリロード
      window.location.reload();
    }
  };

  return (
    <header className="bg-gray-900 text-gray-100 shadow-md py-4 px-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-white">
        ShopShare
      </Link>
      <nav>
        <ul className="flex space-x-2 items-center">
          <li>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </li>
          <li>
            <Link href="/submit-shop">
              <Button variant="ghost">Add Shop</Button>
            </Link>
          </li>
          <li>
            <Link href="/my-page">
              <Button variant="ghost">My Page</Button>
            </Link>
          </li>
          <li>
            {/* ローディング中でなく、ユーザーが存在する場合にユーザー情報を表示 */}
            {!loading && user ? (
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                {user.user_metadata?.avatar_url && (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span>{user.user_metadata?.name || user.email}</span>
              </Button>
            ) : (
              <Button onClick={handleSignIn}>Sign In with Google</Button>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;