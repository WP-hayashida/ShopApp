import Link from 'next/link';

/**
 * 認証エラーページコンポーネント
 * 認証コードの交換に失敗した場合に表示されます。
 */
export default function AuthCodeError() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>認証エラー</h1>
      <p>セッションの取得に失敗しました。</p>
      <p>
        お手数ですが、再度サインインをお試しください。
      </p>
      <Link href="/" className="text-blue-600 hover:underline">トップページに戻る</Link>
    </div>
  );
}
