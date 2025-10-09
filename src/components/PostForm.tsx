import React, { useState } from 'react';
import { ArrowLeft, Upload, MapPin, Clock, Tag, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import Image from "next/image";

interface PostFormProps {
  onNavigate: (page: 'home' | 'mypage') => void;
}

export function PostForm({ onNavigate }: PostFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    location: '',
    hours: '',
    url: '',
    tags: [] as string[],
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const categories = [
    'ラーメン', '寿司', 'カフェ', '和食', 'イタリアン', '中華', 'フレンチ', 
    'ファストフード', '居酒屋', 'バー', 'スイーツ', 'ベーカリー'
  ];


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically submit the data to your backend
    console.log('Submitting:', formData);
    onNavigate('home');
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">新しいお店を投稿する</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">店舗名 *</Label>
                <Input
                  id="name"
                  placeholder="例: 大塚ラーメン本店"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">カテゴリー *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">説明 *</Label>
                <Textarea
                  id="description"
                  placeholder="このお店の魅力を教えてください..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera size={20} />
                写真
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedImage ? (
                  <div className="relative h-48">
                    <Image
                      src={selectedImage}
                      alt="Selected"
                      fill
                      sizes="100vw"
                      className="w-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      削除
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">写真をアップロード</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        ファイルを選択されていません
                      </p>
                    </Label>
                  </div>
                )}
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location and Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">場所・営業時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin size={16} />
                  場所
                </Label>
                <Input
                  id="location"
                  placeholder="東京都豊島区"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="hours" className="flex items-center gap-2">
                  <Clock size={16} />
                  営業時間
                </Label>
                <Input
                  id="hours"
                  placeholder="11:00-22:00"
                  value={formData.hours}
                  onChange={(e) => setFormData({...formData, hours: e.target.value})}
                />
              </div>

            </CardContent>
          </Card>

          {/* URL and Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">追加情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Tag size={16} />
                  タグ
                </Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="タグを入力"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    追加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate('home')}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1">
              投稿する
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}