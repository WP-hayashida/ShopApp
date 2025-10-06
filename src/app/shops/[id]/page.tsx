'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shop } from '@/app/(features)/_lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ShopDetailPage() {
  const params = useParams();
  const { id } = params;
  const supabase = createClient();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setShop(data as Shop);
        } else {
          setError('お探しのショップは見つかりませんでした。');
        }
      } catch (err: any) {
        console.error('Error fetching shop:', err);
        setError(err.message || 'ショップの読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!shop) {
    return null; // Or some other placeholder
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card>
        <CardHeader>
          {shop.photo_url && (
            <div className="relative w-full h-96 mb-6">
              <Image
                src={shop.photo_url}
                alt={shop.name}
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
              />
            </div>
          )}
          <CardTitle className="text-4xl font-bold">{shop.name}</CardTitle>
          <CardDescription className="text-lg text-gray-600">{shop.location} / {shop.category}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">コメント</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{shop.comments || 'コメントはありません'}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-2">営業時間</h3>
            <p className="text-gray-800">{shop.business_hours || '情報なし'}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-2">詳細カテゴリ</h3>
            <p className="text-gray-800">{shop.detailed_category || '情報なし'}</p>
          </div>
          {shop.url && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-2">公式サイト</h3>
                <a href={shop.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {shop.url}
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
