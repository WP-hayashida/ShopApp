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
  category: string[]; // 大カテゴリ
  detailed_category: string; // 詳細カテゴリ
  description: string; // コメント (commentsからマッピング)
  comments?: string | null; // Supabaseのcommentsフィールドに対応
  likes: number; // いいねの数 (like_countからマッピング)
  rating: number; // 評価
  reviewCount: number; // レビュー数
  searchable_categories_text: string | null; // 検索用カテゴリテキスト
  tags: string[]; // タグ
  user: User; // 投稿ユーザー情報
  liked: boolean; // 現在のユーザーがいいねしているか
}

/**
 * フォーム入力値の型
 */
export interface ShopFormInput {
  name: string;
  photo: File | null; // Fileオブジェクトまたはnull
  url: string;
  startTime: string; // 営業時間開始
  endTime: string; // 営業時間終了
  location: string;
  category: string; // フォームでは単一選択
  detailedCategory: string;
  comments: string;
}

/**
 * Supabaseに送信するデータの型
 */
export interface ShopPayload {
  name: string;
  photo_url: string | null;
  url: string | null;
  business_hours: string | null;
  location: string | null;
  category: string[] | null; // Supabaseでは配列
  detailed_category: string | null;
  comments: string | null;
  // user_idはsupabase側で自動設定されるか、別途渡す
}

/**
 * 検索フィルターの型定義
 */
export interface SearchFilters {
  keyword: string;
  location: string;
  category: string[];
  sortBy: string;
}