import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Import Image component
import { ArrowLeft, Heart, Share2, MapPin, Star, ExternalLink, MessageCircle, Train } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Shop } from '@/app/(features)/_lib/types';
import { getCategoryConfig } from './CategoryConfig';

interface StoreDetailProps {
  store: Shop;
  onNavigate: (page: 'home' | 'mypage') => void;
  onLikeToggle: (shopId: string, newLikedStatus: boolean) => void; // Added onLikeToggle prop
}

export function StoreDetail({ store, onNavigate, onLikeToggle }: StoreDetailProps) {
  const [isLiked, setIsLiked] = useState(store.liked);
  const [likesCount, setLikesCount] = useState(store.likes);
  const [comment, setComment] = useState('');
  const [comments] = useState([
    {
      id: '1',
      user: { username: 'グルメ太郎', avatar_url: 'https://i.pravatar.cc/64?u=gourmet_taro' },
      text: 'ここのラーメン本当に美味しいです！スープが濃厚で麺との相性も抜群でした。',
      timestamp: '2時間前',
    },
    {
      id: '2',
      user: { username: '食べ歩き花子', avatar_url: 'https://i.pravatar.cc/64?u=tabearuki_hanako' },
      text: 'チャーシューがとろとろで最高でした。また行きたいです！',
      timestamp: '5時間前',
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
        setWalkingInfo({ stationName: "", walkTime: null, loading: true, error: null });
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
      setWalkingInfo({ stationName: "", walkTime: null, loading: false, error: null });
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
      console.log('Comment submitted:', comment);
      setComment('');
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
            onClick={() => onNavigate('home')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">店舗詳細</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Image */}
            <Card className="overflow-hidden">
              <div className="relative">
                <Image
                  src={store.imageUrl}
                  alt={store.name}
                  width={800} // Arbitrary width, actual size controlled by className
                  height={600} // Arbitrary height, actual size controlled by className
                  priority // Prioritize loading for LCP
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLike}
                    className={`backdrop-blur-sm ${
                      isLiked ? 'bg-red-500/90 text-white hover:bg-red-600/90' : ''
                    }`}
                  >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                    {likesCount}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    className="backdrop-blur-sm"
                  >
                    <Share2 size={16} />
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-1">
                  {store.category.map((cat, index) => {
                    const catConfig = getCategoryConfig(cat);
                    const CatIconComponent = catConfig.icon;
                    return (
                      <Badge
                        key={index}
                        className={`${catConfig.bgColor} backdrop-blur-sm px-2 py-1 border ${catConfig.borderColor}`}
                      >
                        <CatIconComponent className={`size-3 ${catConfig.textColor}`} />
                        <span className={`text-xs font-medium ${catConfig.textColor} ml-1`}>
                          {cat}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Store Info */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={18} fill="currentColor" className="text-yellow-500" />
                        <span className="font-medium">{store.rating}</span>
                      </div>
                      <span className="text-muted-foreground">({store.reviewCount}件のレビュー)</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{store.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {store.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={store.user.avatar_url || ""} />
                        <AvatarFallback>{store.user.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{store.user.username}</div>
                        <div className="text-sm text-muted-foreground">@{store.user.username}</div>
                      </div>
                    </div>
                    <Button variant="outline">フォロー</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={20} />
                    <h3 className="text-xl font-bold">コメント ({comments.length})</h3>
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
                          <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.user.username}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
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
                {store.latitude && store.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full" size="lg">
                      <MapPin size={16} className="mr-2" />
                      地図で見る
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Walking Time Info */}
            {(walkingInfo.loading || (walkingInfo.walkTime && !walkingInfo.error)) && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Train size={20} className="text-muted-foreground" />
                    {walkingInfo.loading ? (
                      <div className="text-sm text-muted-foreground">
                        最寄り駅を検索中...
                      </div>
                    ) : walkingInfo.walkTime ? (
                      <div>
                        <div className="font-medium">
                          {walkingInfo.stationName}駅
                        </div>
                        <div className="text-sm text-muted-foreground">
                          徒歩 約{walkingInfo.walkTime}分
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Stores */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold mb-4">関連するお店</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors">
                      <Image
                        src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=64&h=64&fit=crop`}
                        alt="Related store"
                        width={64} // Explicit width
                        height={64} // Explicit height
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">関連店舗 {i}</div>
                        <div className="text-xs text-muted-foreground">カテゴリ名</div>
                        <div className="flex items-center gap-1 text-xs">
                          <Star size={10} fill="currentColor" className="text-yellow-500" />
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