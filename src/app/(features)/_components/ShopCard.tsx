"use client";

import React, { useState, useEffect } from "react";
import { Shop } from "../_lib/types";
import { Heart, Star, MapPin, Clock, Eye, Share2, Bookmark } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card"; // Adjusted path
import { Button } from "@/components/ui/button"; // Adjusted path
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback"; // Adjusted path
import { getCategoryConfig } from "@/components/CategoryConfig"; // Adjusted path
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js"; // Renamed to avoid conflict with our User interface

interface ShopCardProps {
  shop: Shop; // 表示するお店の情報
  onNavigate: (page: 'detail', shop: Shop) => void; // Added for consistency with StoreCard, though we'll use Link
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onNavigate }) => {
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLiked, setIsLiked] = useState(shop.liked); // Initialize from shop.liked
  const [likeCount, setLikeCount] = useState(shop.likes); // Initialize from shop.likes
  const [loadingLike, setLoadingLike] = useState(false); // Set to false initially

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      setUser(supabaseUser);
    };
    checkUser();
  }, [supabase]);

  const handleLikeToggle = async () => {
    if (!user) {
      alert("いいねするにはログインしてください。");
      return;
    }

    setLoadingLike(true);
    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("shop_id", shop.id);

      if (error) {
        console.error("Error unliking shop:", error);
      } else {
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        shop_id: shop.id,
      });

      if (error) {
        console.error("Error liking shop:", error);
      } else {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    }
    setLoadingLike(false);
  };

  const categoryConfig = getCategoryConfig(shop.category);
  const IconComponent = categoryConfig.icon;

  return (
    <Card className="overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <ImageWithFallback
            src={shop.imageUrl}
            alt={shop.name}
            className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
            width={300} // Added width and height for Next/Image
            height={200}
            onClick={() => onNavigate('detail', shop)}
          />
          
          {/* Category Badge */}
          <div className={`absolute top-3 left-3 ${categoryConfig.bgColor} backdrop-blur-sm rounded-md px-2 py-1 border ${categoryConfig.borderColor}`}>
            <div className="flex items-center space-x-1">
              <IconComponent className={`size-3 ${categoryConfig.textColor}`} />
              <span className={`text-xs font-medium ${categoryConfig.textColor}`}>
                {shop.category}
              </span>
            </div>
          </div>

          {/* Like Button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 size-8 rounded-md bg-background/90 hover:bg-background border shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleLikeToggle(); // Use existing handleLikeToggle
            }}
            disabled={loadingLike}
          >
            <Heart 
              className={`size-4 ${
                isLiked
                  ? 'text-red-500 fill-red-500' 
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="size-8 border">
              <AvatarImage src={shop.user.avatar_url || ""} />
              <AvatarFallback className="text-xs">{shop.user.username ? shop.user.username[0] : 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{shop.user.username}</p>
              <p className="text-xs text-muted-foreground"> @{shop.user.username}</p>
            </div>
            <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md">
              <Star className="size-3 text-amber-600 fill-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{shop.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Store Info */}
          <div className="space-y-2">
            <h3 
              className="font-semibold text-lg leading-tight cursor-pointer hover:text-foreground/80 transition-colors"
              onClick={() => onNavigate('detail', shop)}
            >
              {shop.name}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {shop.description}
            </p>

            {/* Location & Hours */}
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="size-3" />
                <span className="truncate">{shop.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="size-3" />
                  <span>{shop.hours}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {shop.tags.slice(0, 3).map((tag) => (
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
                onClick={() => handleLikeToggle()} // Use existing handleLikeToggle
                disabled={loadingLike}
              >
                <Heart className={`size-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>

              <div className="flex items-center space-x-1 text-muted-foreground">
                <Eye className="size-4" />
                <span className="text-sm">{shop.reviewCount}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="size-8 hover:bg-muted/50">
                <Share2 className="size-4" />
              </Button>
              
              <Button variant="ghost" size="icon" className="size-8 hover:bg-muted/50">
                <Bookmark className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopCard;