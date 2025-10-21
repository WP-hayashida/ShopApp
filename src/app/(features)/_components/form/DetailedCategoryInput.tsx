import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DetailedCategoryInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const DetailedCategoryInput = ({ value, onChange }: DetailedCategoryInputProps) => (
  <div className="space-y-2">
    <Label htmlFor="detailedCategory">詳細カテゴリ</Label>
    <Input
      id="detailedCategory"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="例: スペシャルティコーヒー, 豚骨ラーメン"
    />
  </div>
);