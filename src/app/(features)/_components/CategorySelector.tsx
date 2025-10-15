"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Tag } from "lucide-react";
import { categories as predefinedCategories } from "@/config/categories";

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export function CategorySelector({
  selectedCategories,
  onCategoryChange,
}: CategorySelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleCategorySelect = (category: string) => {
    const isSelected = selectedCategories.includes(category);
    const newCategories = isSelected
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newCategories);
  };

  return (
    <Popover modal={true} open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedCategories.length > 0
              ? selectedCategories.join(", ")
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
              {predefinedCategories.map((category) => (
                <CommandItem
                  key={category}
                  onSelect={() => handleCategorySelect(category)}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category)}
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
  );
}
