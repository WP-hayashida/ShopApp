import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";


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
        <Input
          id="businessHours"
          value={
            businessHours && businessHours.length > 0
              ? businessHours
                  .map((item) => `${item.day}: ${item.time}`)
                  .join(", ")
              : ""
          }
          disabled
          placeholder="店舗を検索すると営業時間が自動入力されます"
        />
      </div>

      {/* カテゴリ表示フィールド */}
      <div className="space-y-2">
        <Label>カテゴリ</Label>
        <Input
          id="categories"
          value={
            selectedCategories.length > 0 ? selectedCategories.join(", ") : ""
          }
          disabled
          placeholder="店舗を検索するとカテゴリが自動入力されます"
        />
      </div>

      {/* 場所表示フィールド */}
      <div className="space-y-2">
        <Label htmlFor="location">住所</Label>
        <Input
          id="location"
          value={locationText}
          disabled
          placeholder="店舗を検索すると住所が自動入力されます"
        />
      </div>
    </>
  );
};
