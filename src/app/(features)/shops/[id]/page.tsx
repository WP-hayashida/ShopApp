'use client';

import React, { useState, useEffect, use } from 'react';
import { StoreDetail } from '@/components/StoreDetail';
import { createClient } from '@/lib/supabase/client';
import { Shop } from '../../_lib/types';
import { useRouter } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const { id: shopId } = use(params);
  const [store, setStore] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null); // Initialize supabase state
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      const client = createClient();
      setSupabase(client);
    };
    initSupabase();
  }, []);

  const handleNavigateBack = () => {
    router.push('/');
  };

  const handleLikeToggle = async (shopId: string, newLikedStatus: boolean) => {
    if (!currentUserId || !supabase) { // Check if supabase is initialized
      alert("いいねするにはログインしてください。");
      return;
    }

    // Optimistically update the UI
    setStore(prevStore => {
      if (!prevStore) return null;
      return {
        ...prevStore,
        likes: newLikedStatus ? prevStore.likes + 1 : prevStore.likes - 1,
        liked: newLikedStatus,
      };
    });

    if (newLikedStatus) {
      // いいねする
      const { error } = await supabase.from("likes").insert({
        user_id: currentUserId,
        shop_id: shopId,
      });
      if (error) {
        if (error.code === '23505') { // Duplicate key error
          console.warn("User already liked this shop.");
        } else {
          console.error("Error liking shop:", error);
        }
        // Revert optimistic update if there's an error
        setStore(prevStore => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            likes: newLikedStatus ? prevStore.likes - 1 : prevStore.likes + 1,
            liked: !newLikedStatus,
          };
        });
      }
    } else {
      // いいねを取り消す
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("shop_id", shopId);
      if (error) {
        console.error("Error unliking shop:", error);
        // Revert optimistic update if there's an error
        setStore(prevStore => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            likes: newLikedStatus ? prevStore.likes - 1 : prevStore.likes + 1,
            liked: !newLikedStatus,
          };
        });
      }
    }
  };

  useEffect(() => {
    if (!supabase) return; // Only run if supabase client is initialized

    const fetchAndSetShop = async () => {
      if (!shopId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;
      setCurrentUserId(currentUserId); // Update the state here

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select(`
          id, name, photo_url, url, business_hours, location, category, detailed_category, comments, price, user_id
        `)
        .eq('id', shopId)
        .single();

      if (shopError) {
        console.error('Error fetching shop:', shopError);
        setLoading(false);
        return;
      }

      if (shopData) {
        let profile = null;
        if (shopData.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', shopData.user_id)
            .single();
          if (profileError) {
            console.error("Error fetching profile data for user_id:", shopData.user_id, profileError);
          } else {
            profile = profileData;
          }
        }

        const shopLikes = shopData.likes || [];
        const shopRatings = shopData.ratings || [];
        const shopReviews = shopData.reviews || [];

        const totalRating = shopRatings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
        const averageRating = shopRatings.length > 0 ? totalRating / shopRatings.length : 0;

        const transformedShop: Shop = {
          id: shopData.id,
          name: shopData.name,
          imageUrl: shopData.photo_url || '/next.svg',
          url: shopData.url,
          hours: shopData.business_hours || 'N/A',
          location: shopData.location,
          category: shopData.category || 'その他',
          detailed_category: shopData.detailed_category,
          description: shopData.comments || '説明がありません。',
          price: shopData.price || '¥1,000〜¥2,000',
          tags: shopData.detailed_category ? shopData.detailed_category.split(',').map((tag: string) => tag.trim()) : [],
          user: {
            name: profile?.username || 'Unknown User',
            avatar: profile?.avatar_url || 'https://i.pravatar.cc/64?u=unknown',
            username: profile?.username || 'unknown_user',
          },
          likes: shopLikes.length,
          liked: currentUserId ? shopLikes.some((like: { user_id: string }) => like.user_id === currentUserId) : false,
          rating: parseFloat(averageRating.toFixed(1)),
          reviewCount: shopReviews.length,
        };
        setStore(transformedShop);
      }

      setLoading(false);
    };

    fetchAndSetShop();
  }, [supabase, shopId]);

  if (loading) {
    return <div className="text-center py-16">読み込み中...</div>;
  }

  if (!store) {
    return <div className="text-center py-16">お店が見つかりませんでした。</div>;
  }

  return (
    <StoreDetail
      store={store}
      onNavigate={handleNavigateBack}
      onLikeToggle={handleLikeToggle}
    />
  );
}