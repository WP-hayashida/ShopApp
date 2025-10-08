"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  House,
  SquarePen,
  LogOut, // Added LogOut icon
  Search, // Add Search icon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input"; // Import Input component
import { useSearch } from "@/context/SearchContext"; // Import useSearch hook

/**
 * ヘッダーコンポーネント
 * ナビゲーションリンクと認証状態に応じた表示（サインイン/サインアウトボタン）を提供します。
 */
const Header: React.FC = () => {
  // ステート変数の定義
  const [user, setUser] = useState<User | null>(null); // ログインユーザー情報
  const [loading, setLoading] = useState(true); // ローディング状態
  const supabase = useMemo(() => createClient(), []); // Supabaseクライアントをメモ化

  const { setSearchTerm } = useSearch();
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 500); // 500msのデバウンス

    return () => {
      clearTimeout(timer);
    };
  }, [localSearchTerm, setSearchTerm]);

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
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // サインアウト処理
  const handleSignOut = async () => {
    if (window.confirm("本当にサインアウトしますか？")) {
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
      <nav className="flex items-center space-x-4">
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="お店を検索..."
            className="pl-8 pr-2 py-1 rounded-md bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
          <Search className="absolute left-2 h-4 w-4 text-gray-400" />
        </div>
        <ul className="flex space-x-2 items-center">
          <li>
            <Link href="/">
              <Button variant="ghost">
                <House className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/submit-shop">
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                <SquarePen className="mr-2 h-4 w-4" />
                Post
              </Button>
            </Link>
          </li>
          <li>
            {!loading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt="@shadcn" />
                      <AvatarFallback>{user?.user_metadata?.name?.[0] || user?.email?.[0] || "G"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  {user ? (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.user_metadata?.name || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/my-page">
                          My Page
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={handleSignIn}>
                      Sign In
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
