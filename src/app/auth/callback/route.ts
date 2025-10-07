import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * 認証コールバックを処理するAPIルート
 * @param request
 * @returns ユーザーをリダイレクトするレスポンス
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next"パラメータがあれば、それをリダイレクト先として使用
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    // 認証コードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // エラーが発生した場合、エラーページにリダイレクト
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
