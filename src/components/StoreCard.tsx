import React from "react";
import {
  Heart,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  Share2,
  Bookmark,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getCategoryConfig } from "./CategoryConfig";
import Link from "next/link";

interface Store {
  id: string;
  name: string;
  category: string[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  user: {
    name: string;
    avatar_url: string;
    username: string;
  };
  description: string;
  location: string;
  hours: string;
  price: string;
  tags: string[];
  liked: boolean;
  likes: number;
}

interface StoreCardProps {
  store: Store;
  onLike: (storeId: string) => void;
}

export function StoreCard({ store, onLike }: StoreCardProps) {
  return (
    <Card className="overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <Link href={`/shops/${store.id}`}>
            <ImageWithFallback
              src={store.imageUrl}
              alt={store.name}
              className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Category Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {store.category.map((cat, index) => {
              const catConfig = getCategoryConfig(cat);
              const CatIconComponent = catConfig.icon;
              return (
                <Badge
                  key={index}
                  className={`${catConfig.bgColor} backdrop-blur-sm px-2 py-1 border ${catConfig.borderColor}`}
                >
                  <CatIconComponent
                    className={`size-3 ${catConfig.textColor}`}
                  />
                  <span
                    className={`text-xs font-medium ${catConfig.textColor} ml-1`}
                  >
                    {cat}
                  </span>
                </Badge>
              );
            })}
          </div>

          {/* Like Button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 size-8 rounded-md bg-background/90 hover:bg-background border shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onLike(store.id);
            }}
          >
            <Heart
              className={`size-4 ${
                store.liked
                  ? "text-red-500 fill-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="size-8 border">
              <AvatarImage src={store.user.avatar_url || ""} />
              <AvatarFallback className="text-xs">
                {store.user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{store.user.username}</p>
              <p className="text-xs text-muted-foreground">
                @{store.user.username}
              </p>
            </div>
            <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md">
              <Star className="size-3 text-amber-600 fill-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {store.rating}
              </span>
            </div>
          </div>

          {/* Store Info */}
          <div className="space-y-2">
            <Link
              href={`/shops/${store.id}`}
              className="font-semibold text-lg leading-tight cursor-pointer hover:text-foreground/80 transition-colors"
            >
              {store.name}
            </Link>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {store.description}
            </p>

            {/* Location & Hours */}
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="size-3" />
                <span className="truncate">{store.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="size-3" />
                  <span>{store.hours}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="size-3" />
                  <span className="font-medium text-foreground">
                    {store.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {store.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs border-border/60 text-muted-foreground"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onLike(store.id)}
              >
                <Heart
                  className={`size-4 ${
                    store.liked ? "text-red-500 fill-red-500" : ""
                  }`}
                />
                <span className="text-sm">{store.likes}</span>
              </button>

              <div className="flex items-center space-x-1 text-muted-foreground">
                <Eye className="size-4" />
                <span className="text-sm">{store.reviewCount}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-muted/50"
              >
                <Share2 className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-muted/50"
              >
                <Bookmark className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
