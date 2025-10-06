'use client';

import React, { useState, useEffect } from "react";
import { Shop } from "../_lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface ShopCardProps {
  shop: Shop;
  editHref?: string; // Optional prop for the edit link
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, editHref }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loadingLike, setLoadingLike] = useState(true);

  useEffect(() => {
    const checkLikeStatus = async () => {
      setLoadingLike(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Fetch like count for this shop
      const { count, error: countError } = await supabase
        .from("likes")
        .select("id", { count: "exact" })
        .eq("shop_id", shop.id);

      if (countError) {
        console.error("Error fetching like count:", countError);
      } else {
        setLikeCount(count || 0);
      }

      if (user) {
        // Check if current user liked this shop
        const { data, error } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("shop_id", shop.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking like status:", error);
        } else {
          setIsLiked(!!data);
        }
      }
      setLoadingLike(false);
    };

    checkLikeStatus();
  }, [shop.id, supabase]);

  const handleLikeToggle = async () => {
    if (!user) {
      alert("いいねするにはログインしてください。");
      return;
    }

    setLoadingLike(true);
    if (isLiked) {
      // Unlike
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
      // Like
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
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0">
        {shop.photo_url ? (
          <Image
            src={shop.photo_url}
            alt={shop.name}
            width={300}
            height={200}
            className="rounded-t-lg object-cover w-full h-48"
          />
        ) : (
          <div className="rounded-t-lg bg-gray-200 w-full h-48 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4 flex-grow">
        <CardTitle className="text-xl font-semibold mb-2">
          {shop.name}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          <p>
            <strong>カテゴリ:</strong> {shop.category}
          </p>
          <p>
            <strong>場所:</strong> {shop.location}
          </p>
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center pb-4 px-4 mt-auto">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLikeToggle}
            disabled={loadingLike}
            className={isLiked ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-gray-500"}
          >
            <Heart fill={isLiked ? "currentColor" : "none"} />
          </Button>
          <span className="text-sm text-gray-600">{likeCount}</span>
        </div>
        {editHref ? (
          <Link href={editHref} passHref>
            <Button variant="secondary" className="transition-transform hover:scale-105 active:scale-95">編集する</Button>
          </Link>
        ) : (
          <Link href={`/shops/${shop.id}`} passHref>
            <Button variant="outline">詳細を見る</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default ShopCard;
