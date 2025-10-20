import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { Shop } from "@/app/(features)/_lib/types";

interface ShopInfoDisplayProps {
  shop: Partial<Shop>;
}

export const ShopInfoDisplay = ({ shop }: ShopInfoDisplayProps) => (
  <>
    {/* 店舗名 */}
    <div className="space-y-2">
      <Label htmlFor="name">店舗名</Label>
      <Input id="name" value={shop.name || ""} disabled />
    </div>

    {/* 場所 */}
    <div className="space-y-2">
      <Label htmlFor="location">場所</Label>
      <Input id="location" value={shop.location || ""} disabled />
    </div>

    {/* Rating Display */}
    {shop.rating && (
      <div className="space-y-2">
        <Label htmlFor="rating">評価</Label>
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400" size={20} />
          <span className="font-bold text-lg">{shop.rating}</span>
        </div>
      </div>
    )}

    {/* Business Hours Display */}
    <div className="space-y-2">
      <Label>営業時間</Label>
      {shop.business_hours_weekly && shop.business_hours_weekly.length > 0 ? (
        <div className="p-4 border rounded-md bg-muted/50 text-sm">
          <ul>
            {shop.business_hours_weekly.map((item: any, index: number) => (
              <li key={index} className="flex justify-between">
                <span>{item.day}</span>
                <span>{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground p-4 border rounded-md">
          営業時間のデータがありません。
        </div>
      )}
    </div>

    {/* カテゴリ */}
    <div className="space-y-2">
      <Label htmlFor="category">カテゴリ</Label>
      <Input id="category" value={shop.category?.[0] || ""} disabled />
    </div>
  </>
);
