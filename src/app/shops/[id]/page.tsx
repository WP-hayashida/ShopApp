'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shop } from '@/app/(features)/_lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * お店の詳細ページコンポーネント
 * URLのIDに基づいて特定のお店の詳細情報を表示します。
 */
export default function ShopDetailPage() {
  const params = useParams();
  // URLからIDを取得（idは string | string[] | undefined の可能性があるため、単一の文字列に整形）
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = createClient();

  // ステート変数の定義
  const [shop, setShop] = useState<Shop | null>(null); // お店情報
  const [loading, setLoading] = useState(true); // ローディング状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  // 副作用フック：お店の情報を取得
  useEffect(() => {
    const fetchShop = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // SupabaseからIDに一致するお店のデータを取得
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
      } catch (err) {
        console.error('Error fetching shop:', err);
        let message = 'ショップの読み込み中にエラーが発生しました。';
        if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [id, supabase]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-10 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // お店情報がない場合の表示
  if (!shop) {
    return null; // もしくはプレースホルダーを表示
  }

  // メインコンテンツの表示
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
