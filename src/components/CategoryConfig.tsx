import { LucideIcon, Coffee, Utensils, ShoppingBag, Home } from 'lucide-react';

interface CategoryConfig {
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const categoryMap: Record<string, CategoryConfig> = {
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
  // Add more categories as needed
};

export function getCategoryConfig(category: string): CategoryConfig {
  return categoryMap[category] || {
    icon: Home, // Default icon
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
  };
}
