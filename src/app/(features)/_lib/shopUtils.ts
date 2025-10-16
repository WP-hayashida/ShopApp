import { ShopFormInput, ShopPayload } from "./types";

/**
 * フォーム入力データをSupabaseに送信するペイロード形式に変換するヘルパー関数
 * @param formData - フォームからの入力データ (ShopFormInput型)
 * @param photoUrl - アップロード済みの写真URL (photoUrlは別途処理されるため、ここでは受け取る)
 * @returns Supabaseに送信するShopPayload型データ
 */
export function transformFormInputToShopPayload(
  formData: ShopFormInput,
  photoUrl: string | null
): ShopPayload {
  return {
    name: formData.name,
    photo_url: photoUrl,
    url: formData.url || null, // 空文字の場合はnullに変換
    location: formData.location || null, // 空文字の場合はnullに変換
    category: formData.category ? [formData.category] : null, // 単一カテゴリを配列に変換
    detailed_category: formData.detailedCategory || null, // 空文字の場合はnullに変換
    comments: formData.comments || null, // 空文字の場合はnullに変換
  };
}
