'use client';

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Shop } from "@/app/(features)/_lib/types";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/app/(features)/_components/ProfileForm";
import FilterableShopList from "@/app/(features)/_components/FilterableShopList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



export default function MyPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [likedShops, setLikedShops] = useState<Shop[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setProfile(profileData);
        } else {
          // No profile found, create a default one
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            username: user.user_metadata?.name || "Unnamed User",
            avatar_url: user.user_metadata?.avatar_url || null,
          });

          if (insertError) {
            console.error("Error creating default profile:", insertError);
          } else {
            setProfile({
              username: user.user_metadata?.name || "Unnamed User",
              avatar_url: user.user_metadata?.avatar_url || null,
            });
          }
        }

        // Fetch shops posted by the user
        const { data: fetchedShops, error: shopsError } = await supabase
          .from("shops")
          .select("*")
          .eq('user_id', user.id);

        if (shopsError) {
          console.error("Error fetching shops for MyPage:", shopsError);
        } else {
          setShops((fetchedShops as Shop[]) || []);
        }

        // Fetch shops liked by the user
        const { data: fetchedLikedShops, error: likedShopsError } = await supabase
          .from('likes')
          .select('shops(*)') // Select all columns from the joined shops table
          .eq('user_id', user.id);

        if (likedShopsError) {
          console.error("Error fetching liked shops:", likedShopsError);
        } else {
          // The result is an array of { shops: Shop } objects, so we map it
          setLikedShops(fetchedLikedShops?.map(like => like.shops) as Shop[] || []);
        }
      }
      setLoading(false);
    };

    fetchUserAndData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Re-fetch data on auth change if needed
      fetchUserAndData();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">マイページ</h1>
        <p>このページを表示するにはサインインが必要です。</p>
        <Button onClick={handleSignIn} className="mt-4">
          Googleでサインイン
        </Button>
      </div>
    );
  }

  const myPosts = shops;

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">マイページ</h1>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="posts">投稿したお店</TabsTrigger>
          <TabsTrigger value="favorites">お気に入りのお店</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <section className="mt-8">
            {profile ? (
              <ProfileForm
                initialUsername={profile.username}
                initialAvatarUrl={profile.avatar_url}
              />
            ) : (
              <p>プロフィールの読み込みに失敗しました。</p>
            )}
          </section>
        </TabsContent>
        <TabsContent value="posts">
          <section className="mt-8">
            {myPosts.length > 0 ? (
              <FilterableShopList initialShops={myPosts} />
            ) : (
              <p>まだ投稿したお店はありません。</p>
            )}
          </section>
        </TabsContent>
        <TabsContent value="favorites">
          <section className="mt-8">
            {likedShops.length > 0 ? (
              <FilterableShopList initialShops={likedShops} />
            ) : (
              <p>お気に入りのお店はまだありません。</p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}