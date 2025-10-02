'use client';

import React from 'react';
import { Shop } from '@/app/(features)/_lib/types';
import { dummyShops } from '@/app/(features)/_lib/data';
import ShopCard from '@/app/(features)/_components/ShopCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// MyPostCard component to wrap ShopCard and add edit/delete buttons
const MyPostCard: React.FC<{ shop: Shop }> = ({ shop }) => {
  return (
    <div className="relative">
      <ShopCard shop={shop} />
      <div className="absolute top-2 right-2 flex space-x-2">
        <Button variant="secondary" size="sm">編集</Button>
        <Button variant="destructive" size="sm">削除</Button>
      </div>
    </div>
  );
};

export default function MyPage() {
  // Using dummy data until authentication is implemented
  const myPosts = dummyShops.slice(0, 1);
  const favoriteShops = dummyShops.slice(1, 2);

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">マイページ</h1>

      {/* My Posts Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">あなたが投稿したお店</h2>
        {myPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {myPosts.map((shop) => (
              <MyPostCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <p>まだ投稿したお店はありません。</p>
        )}
      </section>

      <Separator className="my-12" />

      {/* Favorites Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">お気に入りのお店</h2>
        {favoriteShops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <p>お気に入りのお店はまだありません。</p>
        )}
      </section>
    </div>
  );
}
