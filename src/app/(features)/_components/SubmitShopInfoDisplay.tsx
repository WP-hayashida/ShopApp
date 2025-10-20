import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BusinessHours {
  day: string;
  time: string;
}

interface SubmitShopInfoDisplayProps {
  rating: number | null;
  businessHours: BusinessHours[] | null;
  selectedCategories: string[];
  locationText: string;
}

export const SubmitShopInfoDisplay = ({
  rating,
  businessHours,
  selectedCategories,
  locationText,
}: SubmitShopInfoDisplayProps) => {
  return (
    <>
      {/* Rating Display */}
      {rating && (
        <div className="space-y-2">
          <Label>評価</Label>
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            <span className="font-bold text-lg">{rating}</span>
          </div>
        </div>
      )}

      {/* Business Hours Display */}
      <div className="space-y-2">
        <Label>営業時間</Label>
        {businessHours && businessHours.length > 0 ? (
          <div className="p-4 border rounded-md bg-muted/50 text-sm">
            <ul>
              {businessHours.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.day}</span>
                  <span>{item.time}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 border rounded-md">
            店舗を検索すると営業時間が自動入力されます。
          </div>
        )}
      </div>

      {/* カテゴリ表示フィールド */}
      <div className="space-y-2">
        <Label>カテゴリ</Label>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.length > 0 ? (
            selectedCategories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              店舗を検索するとカテゴリが自動入力されます。
            </p>
          )}
        </div>
      </div>

      {/* 場所表示フィールド */}
      <div className="space-y-2">
        <Label htmlFor="location">場所</Label>
        <Input id="location" value={locationText} disabled placeholder="店舗を検索すると自動入力されます" />
      </div>
    </>
  );
};
