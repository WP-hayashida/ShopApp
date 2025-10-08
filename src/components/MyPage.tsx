import React, { useState } from 'react';
import { Settings, Heart, Upload, User, MapPin, Clock, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';

interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  user: {
    name: string;
    avatar: string;
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

interface MyPageProps {
  stores: Store[];
  onNavigate: (page: 'detail', store: Store) => void;
  onLike: (storeId: string) => void;
}

export function MyPage({ stores, onNavigate, onLike }: MyPageProps) {
  const [activeTab, setActiveTab] = useState('favorites');

  // Mock user data
  const currentUser = {
    name: '八太茶',
    username: 'hatacha',
    avatar: 'https://i.pravatar.cc/128?u=current_user',
    bio: '美味しいお店を探すのが趣味です。特にラーメンとカフェが大好き！',
    followers: 342,
    following: 156,
    posts: 23,
  };

  const favoriteStores = stores.filter(store => store.liked);
  const myPosts = stores.filter(store => store.user.username === 'ramen_taro' || store.user.username === 'cafe_sato');

  const StoreGrid = ({ storeList }: { storeList: Store[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {storeList.map((store) => (
        <Card key={store.id} className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="relative">
            <img
              src={store.imageUrl}
              alt={store.name}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={() => onNavigate('detail', store)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(store.id);
              }}
              className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                store.liked 
                  ? 'bg-red-500/80 text-white' 
                  : 'bg-black/20 text-white hover:bg-black/40'
              }`}
            >
              <Heart size={14} fill={store.liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <CardContent className="p-3" onClick={() => onNavigate('detail', store)}>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm">{store.name}</h3>
                <Badge variant="secondary" className="text-xs">{store.category}</Badge>
              </div>
              
              <div className="flex items-center gap-1">
                <Star size={12} fill="currentColor" className="text-yellow-500" />
                <span className="text-xs">{store.rating}</span>
                <span className="text-muted-foreground text-xs">({store.reviewCount})</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={10} />
                <span className="truncate">{store.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="text-2xl">{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                    <p className="text-muted-foreground">@{currentUser.username}</p>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings size={16} />
                    プロフィール編集
                  </Button>
                </div>
                
                <p className="text-muted-foreground mb-4">{currentUser.bio}</p>
                
                <div className="flex justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <div className="font-bold">{currentUser.posts}</div>
                    <div className="text-sm text-muted-foreground">投稿</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{currentUser.followers}</div>
                    <div className="text-sm text-muted-foreground">フォロワー</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{currentUser.following}</div>
                    <div className="text-sm text-muted-foreground">フォロー中</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart size={16} />
              お気に入りのお店
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Upload size={16} />
              投稿したお店
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              プロフィール
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            {favoriteStores.length > 0 ? (
              <StoreGrid storeList={favoriteStores} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="font-medium mb-2">お気に入りのお店がありません</h3>
                  <p className="text-muted-foreground">気になるお店にハートをつけてお気に入りに追加しましょう</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            {myPosts.length > 0 ? (
              <StoreGrid storeList={myPosts} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="font-medium mb-2">まだ投稿がありません</h3>
                  <p className="text-muted-foreground">お気に入りのお店を投稿してみましょう</p>
                  <Button className="mt-4">お店を投稿する</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">プロフィール設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">表示名</label>
                    <p className="text-muted-foreground">{currentUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ユーザーネーム</label>
                    <p className="text-muted-foreground">@{currentUser.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">自己紹介</label>
                    <p className="text-muted-foreground">{currentUser.bio}</p>
                  </div>
                  <Button>プロフィールを編集</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}