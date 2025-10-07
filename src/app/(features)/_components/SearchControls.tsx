"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

// Constants can be moved to a separate file later
const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const categories = [
  "カフェ", "レストラン", "ラーメン", "バー", "居酒屋", "焼肉", "寿司", "パン屋", "スイーツ", "雑貨屋", "書店", "アパレル", "美容室", "その他",
];

const sortOptions = [
  { value: "created_at.desc", label: "新着順" },
  { value: "created_at.asc", label: "古い順" },
  { value: "like_count.desc", label: "いいね順" },
];

export interface SearchFilters {
  keyword: string;
  location: string;
  category: string;
  sortBy: string;
}

interface SearchControlsProps {
  initialFilters: SearchFilters;
  onSearch: (filters: SearchFilters) => void;
}



const defaultResetFilters: SearchFilters = {
  keyword: "",
  location: "",
  category: "",
  sortBy: "created_at.desc", // 新着順をデフォルトに
};

export const SearchControls: React.FC<SearchControlsProps> = ({
  initialFilters,
  onSearch,
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // initialFilters プロップスの変更を検知して filters ステートを更新
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleApply = () => {
    onSearch(filters);
    setIsDrawerOpen(false);
  };

  const handleReset = () => {
    setFilters(defaultResetFilters);
    onSearch(defaultResetFilters);
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="mb-4 ml-auto">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          検索・絞り込み
        </Button>
      </DrawerTrigger>
      <DrawerContent onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>検索・絞り込み</DrawerTitle>
            <DrawerDescription>
              お店を検索・絞り込みます。
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="keyword">キーワード</Label>
                <Input
                  id="keyword"
                  value={filters.keyword}
                  onChange={(e) =>
                    setFilters({ ...filters, keyword: e.target.value })
                  }
                  placeholder="キーワードを入力"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">場所</Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) =>
                    setFilters({ ...filters, location: value })
                  }
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="場所を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unselected__">未選択</SelectItem>
                    {prefectures.map((prefecture) => (
                      <SelectItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value === "__unselected__" ? "" : value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unselected__">未選択</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortBy">並び順</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters({ ...filters, sortBy: value })
                  }
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="並び順を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DrawerFooter className="mt-auto border-t bg-background p-4">
            <Button onClick={handleApply}>検索</Button>
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              variant="outline"
            >
              リセット
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};