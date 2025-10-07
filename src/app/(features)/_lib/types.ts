/**
 * お店の情報を表すインターフェース
 */
export interface Shop {
  id: string; // 店舗の一意なID
  name: string; // 店舗名
  photo_url: string; // 写真のURL
  url: string; // 関連URL
  business_hours: string; // 営業時間
  location: string; // 場所（都道府県など）
  category: string; // 大カテゴリ
  detailed_category: string; // 詳細カテゴリ
  comments: string; // コメント
  like_count?: number; // いいねの数（オプショナル）
}
