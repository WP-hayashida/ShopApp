/**
 * ユーザー情報を表すインターフェース
 */
export interface User {
  username: string; // ユーザー名
  avatar_url: string | null; // アバター画像のURL
}

/**
 * お店の情報を表すインターフェース
 */
export interface Shop {
  id: string; // 店舗の一意なID
  name: string; // 店舗名
  imageUrl: string; // 写真のURL (photo_urlからマッピング)
  url: string; // 関連URL
  hours: string; // 営業時間 (business_hoursからマッピング)
  location: string; // 場所（都道府県など）
  category: string; // 大カテゴリ
  detailed_category: string; // 詳細カテゴリ
  description: string; // コメント (commentsからマッピング)
  comments?: string | null; // Supabaseのcommentsフィールドに対応
  likes: number; // いいねの数 (like_countからマッピング)
  rating: number; // 評価
  reviewCount: number; // レビュー数
  tags: string[]; // タグ
  user: User; // 投稿ユーザー情報
  liked: boolean; // 現在のユーザーがいいねしているか
}
