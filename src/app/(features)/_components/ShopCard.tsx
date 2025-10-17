import React, { useState, useEffect } from "react";
import { Shop } from "../_lib/types";
import { Heart, MapPin, Clock, Eye, Share2, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card"; // Adjusted path
import { Button } from "@/components/ui/button"; // Adjusted path
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback"; // Adjusted path
import { getCategoryConfig } from "@/components/CategoryConfig"; // Adjusted path
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js"; // Renamed to avoid conflict with our User interface
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShopCardProps {
  shop: Shop; // 表示するお店の情報
  onNavigate: (page: "detail", shop: Shop) => void; // Added for consistency with StoreCard, though we'll use Link
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onNavigate }) => {
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLiked, setIsLiked] = useState(shop.liked); // Initialize from shop.liked
  const [likeCount, setLikeCount] = useState(shop.likes); // Initialize from shop.likes
  const [loadingLike, setLoadingLike] = useState(false); // Set to false initially

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
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

  return (
    <Card className="w-full overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 group h-80 flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <ImageWithFallback
            src={shop.imageUrl}
            alt={shop.name}
            className="w-full h-36 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
            width={300} // Added width and height for Next/Image
            height={200}
            onClick={() => onNavigate("detail", shop)}
          />

          {/* Category Badges */}
          <div className="absolute top-3 left-3 flex gap-1 overflow-x-auto whitespace-nowrap pr-2 w-[calc(100%-2rem)]">
            {shop.category.map((cat, index) => {
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
        </div>

        {/* Content & Actions Wrapper */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Store Info */}
          <div className="space-y-2 flex-grow max-h-30 overflow-hidden">
            <h3
              className="font-semibold text-lg leading-tight cursor-pointer hover:text-foreground/80 transition-colors truncate"
              onClick={() => onNavigate("detail", shop)}
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
                  <span className="truncate">{shop.hours}</span>
                </div>
              </div>
              {shop.price_range && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">価格帯:</span>
                  <span className="text-sm">{shop.price_range}</span>
                </div>
              )}
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
                <Heart
                  className={`size-4 ${
                    isLiked ? "text-red-500 fill-red-500" : ""
                  }`}
                />
                <span className="text-sm">{likeCount}</span>
              </button>

              <div className="flex items-center space-x-1 text-muted-foreground">
                <Eye className="size-4" />
                <span className="text-sm">{shop.reviewCount}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="size-8 border cursor-pointer">
                      <AvatarImage src={shop.user.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {shop.user.username ? shop.user.username[0] : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{shop.user.username}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
};

export default ShopCard;
