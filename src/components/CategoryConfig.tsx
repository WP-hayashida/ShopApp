import { LucideIcon, Coffee, Utensils, ShoppingBag, Home } from 'lucide-react';
import { categories } from '@/config/categories';

interface CategoryConfig {
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const baseCategoryMap: Record<string, CategoryConfig> = {
  "カフェ": {
    icon: Coffee,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  "レストラン": {
    icon: Utensils,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
  },
  "ショッピング": {
    icon: ShoppingBag,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  // Add more specific categories as needed
};

const defaultCategoryConfig: CategoryConfig = {
  icon: Home, // Default icon
  bgColor: "bg-gray-50",
  borderColor: "border-gray-200",
  textColor: "text-gray-700",
};

const categoryMap: Record<string, CategoryConfig> = categories.reduce((acc, category) => {
  acc[category] = baseCategoryMap[category] || defaultCategoryConfig;
  return acc;
}, {} as Record<string, CategoryConfig>);

export function getCategoryConfig(category: string): CategoryConfig {
  return categoryMap[category] || defaultCategoryConfig;
}
