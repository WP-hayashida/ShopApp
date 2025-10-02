'use client';

import React from 'react';
import { Shop } from '../_lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ShopCardProps {
  shop: Shop;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <Card className="w-[300px] shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <Image
          src={shop.photo_url}
          alt={shop.name}
          width={300}
          height={200}
          className="rounded-t-lg object-cover w-full h-48"
        />
      </CardHeader>
      <CardContent className="pt-4">
        <CardTitle className="text-xl font-semibold mb-2">{shop.name}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          <p><strong>カテゴリ:</strong> {shop.category}</p>
          <p><strong>場所:</strong> {shop.location}</p>
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-end pb-4 pr-4">
        <a href={shop.url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">詳細を見る</Button>
        </a>
      </CardFooter>
    </Card>
  );
};

export default ShopCard;