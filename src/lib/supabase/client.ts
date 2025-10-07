// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../database.types";

/**
 * クライアントサイド用のSupabaseクライアントを作成する関数
 * ブラウザ環境（クライアントコンポーネント）で使用します。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
