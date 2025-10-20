import React, { useState, useEffect } from "react";
import Image from "next/image"; // Import Image component
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  ExternalLink,
  MessageCircle,
  Train,
  Clock,
  Phone,
  BadgeJapaneseYen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion"; // Added Accordion imports
import { Shop, BusinessHours } from "@/app/(features)/_lib/types"; // Added BusinessHours
import { getCategoryConfig } from "./CategoryConfig";

interface StoreDetailProps {
  store: Shop;
  onNavigate: (page: "home" | "mypage") => void;
  onLikeToggle: (shopId: string, newLikedStatus: boolean) => void; // Added onLikeToggle prop
}

export function StoreDetail({
  store,
  onNavigate,
  onLikeToggle,
}: StoreDetailProps) {
  const [isLiked, setIsLiked] = useState(store.liked);
  const [likesCount, setLikesCount] = useState(store.likes);
  const getTodayHours = (hoursData: BusinessHours[]) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const todayDay = days[dayOfWeek];
    return hoursData.find((item) => item.day === todayDay);
  };

  const getStatusAndColor = (hours: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (hours === "定休日") {
      return { status: "定休日", color: "text-red-500" };
    }

    const [openTimeStr, closeTimeStr] = hours.split(" - ");
    if (!openTimeStr || !closeTimeStr) {
      return { status: "時間外", color: "text-muted-foreground" };
    }

    const [openHour, openMinute] = openTimeStr.split(":").map(Number);
    const [closeHour, closeMinute] = closeTimeStr.split(":").map(Number);

    const isOpen =
      (currentHour > openHour ||
        (currentHour === openHour && currentMinute >= openMinute)) &&
      (currentHour < closeHour ||
        (currentHour === closeHour && currentMinute < closeMinute));

    return {
      status: isOpen ? "営業時間内" : "時間外",
      color: isOpen ? "text-green-500" : "text-muted-foreground",
    };
  };

  const currentWeeklyHours = store.business_hours_weekly;
  const weeklyHoursArray: BusinessHours[] = Array.isArray(currentWeeklyHours)
    ? (currentWeeklyHours as unknown as BusinessHours[])
    : [];

  const todayHours = getTodayHours(weeklyHoursArray);
  const { color: todayColor } = todayHours
    ? getStatusAndColor(todayHours.time) // Use todayHours.time
    : { color: "text-muted-foreground" };

  const [comment, setComment] = useState("");
  const [comments] = useState([
    {
      id: "1",
      user: {
        username: "グルメ太郎",
        avatar_url: "https://i.pravatar.cc/64?u=gourmet_taro",
      },
      text: "ここのラーメン本当に美味しいです！スープが濃厚で麺との相性も抜群でした。",
      timestamp: "2時間前",
    },
    {
      id: "2",
      user: {
        username: "食べ歩き花子",
        avatar_url: "https://i.pravatar.cc/64?u=tabearuki_hanako",
      },
      text: "チャーシューがとろとろで最高でした。また行きたいです！",
      timestamp: "5時間前",
    },
  ]);

  const [walkingInfo, setWalkingInfo] = useState({
    stationName: "",
    walkTime: null as number | null,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    if (store.latitude && store.longitude) {
      const fetchWalkingTime = async () => {
        setWalkingInfo({
          stationName: "",
          walkTime: null,
          loading: true,
          error: null,
        });
        try {
          const response = await fetch(
            `/api/walk-time?lat=${store.latitude}&lng=${store.longitude}`
          );
          if (!response.ok) {
            if (response.status === 404) {
              setWalkingInfo({
                stationName: "",
                walkTime: null,
                loading: false,
                error: "近くに駅が見つかりませんでした。",
              });
              return;
            }
            throw new Error("Failed to fetch walking time");
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          setWalkingInfo({
            stationName: data.stationName,
            walkTime: data.walkTime,
            loading: false,
            error: null,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setWalkingInfo({
            stationName: "",
            walkTime: null,
            loading: false,
            error: errorMessage,
          });
          console.error(err);
        }
      };
      fetchWalkingTime();
    } else {
      setWalkingInfo({
        stationName: "",
        walkTime: null,
        loading: false,
        error: null,
      });
    }
  }, [store.latitude, store.longitude]);

  const handleLike = () => {
    const newLikedStatus = !isLiked;
    setIsLiked(newLikedStatus);
    setLikesCount(newLikedStatus ? likesCount + 1 : likesCount - 1);
    onLikeToggle(store.id, newLikedStatus); // Call the prop function
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: store.name,
        text: store.description,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // Here you would typically submit the comment to your backend
      console.log("Comment submitted:", comment);
      setComment("");
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("home")}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">店舗詳細</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 店舗名とバッジをここに配置 */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
              <div className="flex flex-wrap gap-1 items-center">
                {/* Added items-center */}
                {store.category.map((cat, index) => {
                  const catConfig = getCategoryConfig(cat);
                  const CatIconComponent = catConfig.icon;
                  return (
                    <Badge
                      key={index}
                      className={`${catConfig.bgColor} px-2 py-1 border ${catConfig.borderColor}`}
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
                {(walkingInfo.loading ||
                  (walkingInfo.walkTime && !walkingInfo.error)) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1 ml-auto" // Added ml-auto here
                  >
                    <Train size={16} />
                    {walkingInfo.loading ? (
                      <span className="text-xs">検索中...</span>
                    ) : walkingInfo.walkTime ? (
                      <span className="text-xs">
                        {walkingInfo.stationName} 徒歩約{walkingInfo.walkTime}分
                      </span>
                    ) : null}
                  </Button>
                )}
              </div>
            </div>

            {/* Store Image */}
            <Card className="overflow-hidden">
              <div className="relative">
                <Image
                  src={store.photo_url_api || store.imageUrl} // Use API photo if available
                  alt={store.name}
                  width={800} // Arbitrary width, actual size controlled by className
                  height={600} // Arbitrary height, actual size controlled by className
                  priority // Prioritize loading for LCP
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
            </Card>

            {/* Moved UI Elements (イイネボタンとシェアボタン、ユーザー情報) */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLike}
                  className={`${
                    isLiked
                      ? "bg-red-500/90 text-white hover:bg-red-600/90"
                      : ""
                  }`}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                  {likesCount}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleShare}>
                  <Share2 size={16} />
                </Button>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={store.user.avatar_url || ""} />
                  <AvatarFallback>{store.user.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {store.user.username}
                  </div>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star
                          size={18}
                          fill="currentColor"
                          className="text-yellow-500"
                        />
                        <span className="font-medium">
                          {store.rating?.toFixed(1) ?? "N/A"}
                        </span>
                        {/* Use store.rating */}
                      </div>
                      <span className="text-muted-foreground">
                        ({store.reviewCount}件のレビュー)
                      </span>
                      {store.latitude && store.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto" // Added ml-auto here
                        >
                          <Button variant="secondary" size="sm">
                            <MapPin size={16} className="mr-1" />
                            MAP
                          </Button>
                        </a>
                      )}
                    </div>

                    {/* 新しい詳細情報セクション */}
                    <div className="space-y-2 mb-4 text-muted-foreground text-sm">
                      {store.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>
                            {store.location.replace(store.name, "").trim()}
                          </span>
                        </div>
                      )}
                      {/* 営業時間 */}
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="mt-1" />
                        <div>
                          {todayHours ? (
                            <div className={`font-medium ${todayColor}`}>
                              今日 ({todayHours.day}): {todayHours.time}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              営業時間不明
                            </div>
                          )}
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            <AccordionItem value="item-1">
                              <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline">
                                今週の営業時間を見る
                              </AccordionTrigger>
                              <AccordionContent>
                                {weeklyHoursArray.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between text-sm py-0.5"
                                  >
                                    <span>{item.day}</span>
                                    <span className="text-muted-foreground">
                                      {item.time}
                                    </span>
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>
                      {/* Corrected closing tag */}
                      {/* 電話番号 */}
                      {store.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          <span>{store.phone_number}</span>
                          {/* Use store.phone_number */}
                        </div>
                      )}
                      {/* 価格帯 */}
                      {store.price_range && (
                        <div className="flex items-center gap-2">
                          <BadgeJapaneseYen size={16} />
                          <span>{store.price_range}</span>
                          {/* Use store.price_range */}
                        </div>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {store.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {store.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 mt-4"></div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={20} />
                    <h3 className="text-xl font-bold">
                      コメント ({comments.length})
                    </h3>
                  </div>

                  {/* Comment Form */}
                  <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <Textarea
                      placeholder="コメントを書く..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={!comment.trim()}>
                        コメントする
                      </Button>
                    </div>
                  </form>

                  <Separator />

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user.avatar_url || ""} />
                          <AvatarFallback>
                            {comment.user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {store.url && (
                  <a href={store.url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full" size="lg">
                      <ExternalLink size={16} className="mr-2" />
                      ウェブサイトを見る
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Related Stores */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold mb-4">関連するお店</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex gap-3 cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors"
                    >
                      <Image
                        src={`https://images.unsplash.com/photo-${
                          1500000000000 + i
                        }?w=64&h=64&fit=crop`}
                        alt="Related store"
                        width={64} // Explicit width
                        height={64} // Explicit height
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          関連店舗 {i}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          カテゴリ名
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Star
                            size={10}
                            fill="currentColor"
                            className="text-yellow-500"
                          />
                          <span>4.{5 + i}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
