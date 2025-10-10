"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Tag } from "lucide-react";
import { categories } from "@/config/categories";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

// NOTE: This is a copy from the original file, assuming it's correct.
const prefectures = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

const sortOptions = [
  { value: "created_at.asc", label: "新着順" },
  { value: "created_at.desc", label: "古い順" },
  { value: "likes.desc", label: "いいね順" },
];

import { SearchFilters } from "../_lib/types";

interface SearchControlsProps {
  initialFilters: SearchFilters;
  onSearch: (filters: SearchFilters) => void;
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  initialFilters,
  onSearch,
}) => {
  const [localKeyword, setLocalKeyword] = useState(initialFilters.keyword);
  const [localLocation, setLocalLocation] = useState(initialFilters.location);
  const [localSortBy, setLocalSortBy] = useState(initialFilters.sortBy);
  const [localCategories, setLocalCategories] = useState<string[]>(
    initialFilters.category
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  useEffect(() => {
    setLocalKeyword(initialFilters.keyword);
    setLocalLocation(initialFilters.location);
    setLocalSortBy(initialFilters.sortBy);
    setLocalCategories(initialFilters.category);
  }, [initialFilters]);

  const handleCategoryChange = (category: string, isChecked: boolean) => {
    setLocalCategories((prevCategories) => {
      const newCategories = isChecked
        ? [...prevCategories, category]
        : prevCategories.filter((c) => c !== category);
      return newCategories;
    });
  };

  const handleApply = () => {
    onSearch({
      keyword: localKeyword,
      location: localLocation,
      category: localCategories,
      sortBy: localSortBy,
    });
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    setLocalKeyword("");
    setLocalLocation("");
    setLocalSortBy("created_at.asc");
    setLocalCategories([]);
    onSearch({
      keyword: "",
      location: "",
      category: [],
      sortBy: "created_at.asc",
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4 ml-auto">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          検索・絞り込み
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>検索・絞り込み</DialogTitle>
          <DialogDescription>お店を検索・絞り込みます。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* キーワード入力 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="keyword" className="text-right">
              キーワード
            </Label>
            <Input
              id="keyword"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              placeholder="キーワードを入力"
              className="col-span-3"
            />
          </div>
          {/* 場所選択 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              場所
            </Label>
            <Select
              value={localLocation}
              onValueChange={(value) => setLocalLocation(value)}
            >
              <SelectTrigger id="location" className="col-span-3">
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
          {/* カテゴリ選択 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              カテゴリ
            </Label>
            <Popover
              modal={true}
              open={categoryPopoverOpen}
              onOpenChange={setCategoryPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryPopoverOpen}
                  className="col-span-3 justify-between"
                >
                  <span className="truncate">
                    {localCategories.length > 0
                      ? localCategories.join(", ")
                      : "カテゴリを選択"}
                  </span>
                  <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="カテゴリを検索..." />
                  <CommandList className="max-h-52 overflow-y-auto">
                    <CommandEmpty>カテゴリが見つかりません。</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category}
                          onSelect={() => {
                            handleCategoryChange(
                              category,
                              !localCategories.includes(category)
                            );
                          }}
                        >
                          <Checkbox
                            checked={localCategories.includes(category)}
                            className="mr-2"
                          />
                          {category}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {/* 並び順選択 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sortBy" className="text-right">
              並び順
            </Label>
            <Select
              value={localSortBy}
              onValueChange={(value) => setLocalSortBy(value)}
            >
              <SelectTrigger id="sortBy" className="col-span-3">
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
        <DialogFooter>
          <Button onClick={handleReset} variant="outline">
            リセット
          </Button>
          <Button onClick={handleApply}>検索</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
