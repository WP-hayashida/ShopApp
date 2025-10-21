import { LucideIcon, Coffee, Utensils, Home, GlassWater, ChefHat, Pizza, Fish, Cake, Wheat, Beer } from "lucide-react";

export const categories = [
  "ラーメン",
  "寿司",
  "カフェ",
  "和食",
  "イタリアン",
  "中華",
  "フレンチ",
  "ファストフード",
  "居酒屋",
  "バー",
  "スイーツ",
  "ベーカリー",
];

export type Category = (typeof categories)[number];

interface CategoryConfig {
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const categoryConfigMap: Record<Category, CategoryConfig> = {
  "ラーメン": {
    icon: Utensils, // Using Utensils as a stand-in
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
  },
  "寿司": {
    icon: Fish,
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
  },
  "カフェ": {
    icon: Coffee,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  "和食": {
    icon: GlassWater, // Using GlassWater as a stand-in
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
  },
  "イタリアン": {
    icon: Pizza,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
  },
  "中華": {
    icon: ChefHat, // Using ChefHat as a stand-in
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    textColor: "text-rose-700",
  },
  "フレンチ": {
    icon: ChefHat,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  "ファストフード": {
    icon: Utensils,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
  },
  "居酒屋": {
    icon: Beer,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
  },
  "バー": {
    icon: GlassWater,
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
  },
  "スイーツ": {
    icon: Cake,
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
  },
  "ベーカリー": {
    icon: Wheat,
    bgColor: "bg-lime-50",
    borderColor: "border-lime-200",
    textColor: "text-lime-700",
  },
};

const defaultCategoryConfig: CategoryConfig = {
  icon: Home,
  bgColor: "bg-gray-50",
  borderColor: "border-gray-200",
  textColor: "text-gray-700",
};

export function getCategoryConfig(category: string): CategoryConfig {
  return categoryConfigMap[category as Category] || defaultCategoryConfig;
}