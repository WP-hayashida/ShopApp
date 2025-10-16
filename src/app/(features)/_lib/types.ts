import { Json } from "@/lib/database.types";

/**
 * 構造化された営業時間を表すインターフェース
 */
export interface BusinessHours {
  day: string;
  time: string;
}

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
  price_range?: string; // 価格帯を追加
  business_hours_weekly?: Json | null; // 週ごとの営業時間
  phone_number?: string; // 電話番号
  photo_url_api?: string; // APIから取得した写真のURL
  api_last_updated?: string; // API最終更新日時
  // --- Google Maps Platform 関連の追加フィールド ---
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  formatted_address: string | null;
  nearest_station_name: string | null;
  nearest_station_place_id: string | null;
  walk_time_from_station: number | null;
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
  // --- Google Maps Platform 関連の追加フィールド ---
  address: string; // 住所入力用
  nearestStationInput: string; // 最寄り駅入力用
}

/**
 * Supabaseに送信するデータの型
 */
export interface ShopPayload {
  name: string;
  photo_url: string | null;
  url: string | null;
  business_hours_weekly?: Json | null; // 週ごとの営業時間
  rating?: number | null; // 評価
  location: string | null;
  category: string[] | null; // Supabaseでは配列
  detailed_category: string | null;
  comments: string | null;
  // user_idはsupabase側で自動設定されるか、別途渡す
  // --- Google Maps Platform 関連の追加フィールド ---
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  formatted_address?: string | null;
  nearest_station_name?: string | null;
  nearest_station_place_id?: string | null;
  walk_time_from_station?: number | null;
}

/**
 * 検索フィルターの型定義
 */
export interface SearchFilters {
  keyword?: string; // キーワード検索（店名、詳細カテゴリ、コメント、検索用カテゴリテキスト、最寄り駅名が対象）
  search_lat?: number | null; // 周辺検索の中心緯度
  search_lng?: number | null; // 周辺検索の中心経度
  search_radius?: number | null; // 周辺検索の半径（メートル単位）。nullの場合は周辺検索を行わない
  location_text?: string; // UI表示用の場所テキスト（オートコンプリートの選択結果やフリーワード）
  category?: string[]; // カテゴリフィルター（複数選択可能）
  sortBy?: string; // 並び順（例: 'created_at.desc', 'likes.desc'）
  location?: string;
}