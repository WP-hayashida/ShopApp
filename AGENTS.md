# ShopShare 開発ガイドライン（AGENTS）

このドキュメントは、ShopShare の開発における「汎用ガイドライン」と「アプリ専用ガイドライン」をまとめたものです。エージェント（Codex）/開発者の双方が遵守します。

## 汎用ガイドライン

### 命名規則（TypeScript/React/Next.js）
- ファイル/ディレクトリ
  - コンポーネント: `PascalCase`（例: `ShopCard.tsx`）
  - フック: `camelCase` 先頭 `use*`（例: `useShopDetails.ts`）
  - ユーティリティ/サービス: `camelCase`（例: `shopService.ts`, `shopMapper.ts`）
  - ページ/ルート: Next.js の規約に準拠（`page.tsx`, `route.ts`）
- 変数/関数/プロパティ: `camelCase`
- 型/インターフェース/クラス: `PascalCase`（先頭 `I` は付けない）
- 列挙型: `PascalCase`、メンバーは `PascalCase`（または用途により `SCREAMING_SNAKE_CASE`）
- 定数: `SCREAMING_SNAKE_CASE`（例: `DEFAULT_PAGE_SIZE`）
- 環境変数: `SCREAMING_SNAKE_CASE` + `NEXT_PUBLIC_` 接頭辞はクライアント公開用

### オブジェクト指向・設計指針（関数型併用）
- 責務分離（SRP）
  - UI（`components`）とロジック（`_hooks`/`_lib`/サービス）と型（`types.ts`）を分離
  - データ取得や外部 API 呼び出しはサービス層へ（例: `shopService.ts`, `userService.ts`）
- 依存境界
  - ページ/コンポーネント → フック → サービス の一方向依存を保つ
  - Supabase/Google API への依存はサービス層に集約し、UI から直接呼ばない
- データマッピング
  - DB/RPC 戻り値 → UI 用ドメイン型へ変換を専用マッパーに集約（例: `shopMapper.ts`）
- 例外/エラーハンドリング
  - サービス層で失敗理由を判定し、UI ではユーザー向けに簡潔表示
- コンポジション優先
  - クラスの多用は避け、React のコンポジション/カスタムフック/純関数を基本とする
  - 共有ロジックはカスタムフック、共有 UI は `shared`/`ui` へ抽出

### 共通化方針（DRY）
- UI 共通化: shadcn/ui ベースで再利用可能なプリミティブを `src/components/ui` に配置
- 共有コンポーネント: アプリ横断の表示/振る舞いは `src/components/shared` に配置
- ロジック共通化: データ取得/更新・ビジネスロジックは `src/app/(features)/**/_lib` か `src/lib` へ集約
- 型の単一出所: フロントのドメイン型は `types.ts` に集約し、API/DB 側との境界で明示的に変換
- 繰り返しパターンはユーティリティ化（`src/lib/utils.ts` 等）

### コーディング規約
- TypeScript（`.ts/.tsx`）、インデント 2 スペース
- Tailwind ユーティリティを優先、インライン style は回避
- ESLint に準拠し、警告/エラーは解消してからコミット

### テスト/検証
- ランナー未設定。導入時は Vitest + React Testing Library を推奨
- 優先順位: API ルート、フック、機能コンポーネントのクリティカルパス

### コミット/PR
- コミット: 英語・命令形・現在形で短く（例: "Add shop search API"）
- PR: 変更概要、スクリーンショット（UI）、検証手順、関連 Issue を添付

### セキュリティ/構成
- 環境変数は `.env.local`、秘密情報はログ出力しない
- DB 変更は `supabase/migrations/*` の原子的 SQL で管理

---

## アプリ専用ガイドライン（ShopShare）

### プロジェクト概要
- 目的: おすすめの「お店」を共有・検索・閲覧し、いいね/投稿/編集が可能な Web アプリ
- 技術: Next.js App Router, TypeScript, Tailwind v4, shadcn/ui, Supabase, Google Maps Platform

### 画面・機能（実装済み）
- ホーム（`src/app/(features)/home/page.tsx`）
  - 店舗一覧の表示・検索（キーワード/カテゴリ）
  - いいねトグル（要サインイン）
  - 店舗詳細へ遷移
- 店舗詳細（`src/app/(features)/shops/[id]/page.tsx`）
  - 基本情報、営業時間、価格帯、電話番号、写真（API 由来含む）
  - 最寄り駅と徒歩時間（サーバ API で算出）
  - いいねトグル、戻る遷移
- 店舗投稿（`src/app/(features)/submit-shop/page.tsx`）
  - Places Autocomplete、Geocoding/Place Details による自動補完
  - 写真/URL/詳細カテゴリ/コメント入力、サインイン必須
- マイページ（`src/app/(features)/my-page/page.tsx`）
  - タブ: お気に入り、投稿一覧、プロフィール
  - 投稿の削除、プロフィール編集
- 認証
  - サインイン（`src/app/auth/signin/page.tsx`）、コールバック（`src/app/auth/callback/route.ts`）

### サーバ API（App Router）
- `GET /api/autocomplete`（`src/app/api/autocomplete/route.ts`）: Places Autocomplete v1
- `GET /api/geocode`（`src/app/api/geocode/route.ts`）: 住所 → 緯度経度
- `GET /api/placedetails`（`src/app/api/placedetails/route.ts`）: Place ID → 詳細（Supabase キャッシュ 24h）
- `GET /api/walk-time`（`src/app/api/walk-time/route.ts`）: 最寄り駅探索 + 徒歩時間算出
- `POST /api/shops`（`src/app/api/shops/route.ts`）: 店舗投稿（サインイン必須）

注意: API キーや機微情報はサーバ側で扱い、ログに出力しない

### アーキテクチャ/依存
- ページ/サーバルート: `src/app`
- 状態管理: `src/context`（`AuthContext`, `SearchContext`）
- サービス/マッパー/型: `src/app/(features)/**/_lib`（`shopService.ts`, `shopMapper.ts`, `types.ts` 等）
- Supabase: 認証/DB/Storage、RPC `search_shops` による検索
- Google Maps Platform: Places/Geocoding/Directions（詳細・写真・価格・駅探索・徒歩時間）

### ディレクトリ構成（要遵守）
- ルート: `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `AGENTS.md`
- `src/app`: ページ/レイアウト/グローバル CSS、API ルートは `api/*/route.ts`
- `src/app/(features)/*`: 機能単位のグループ（`_components`/`_hooks`/`_lib` を併置）
- `src/components/ui`: shadcn/ui ベースの共通 UI
- `src/components/shared`: 共有コンポーネント（`Header`, `ImageWithFallback` など）
- `src/context`: `AuthContext`, `SearchContext`
- `src/lib`: Supabase クライアント、共通ユーティリティ
- `src/config`: 静的設定（`categories.ts` 等）
- `public`: 静的アセット
- `supabase/migrations`: SQL マイグレーション

### 命名規則（アプリ固有の補足）
- 機能配下の役割名
  - UI は `_components`、状態/副作用は `_hooks`、ドメイン型/サービス/マッパーは `_lib`
- RPC/サーバ関数
  - Supabase RPC 名はスネークケース（例: `search_shops`）
  - API ルートは `kebab-case` ディレクトリ名 + 固定 `route.ts`（例: `walk-time/route.ts`）
- DB 由来の生フィールドはサービス/マッパー内で UI 向けに整形（型の乖離を UI へ漏らさない）

### 環境変数（.env.local）
- クライアント公開可
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - `NEXT_PUBLIC_BASE_URL`（例: `http://localhost:3000`）
- サーバ専用（公開不可）
  - `GOOGLE_PLACES_API_KEY`

### ビルド/開発/検証
- 開発: `npm run dev`
- 本番ビルド: `npm run build`
- 本番実行: `npm start`
- Lint: `npm run lint`

### データモデル概要（フロント）
- 主な店舗フィールド
  - `id`, `name`, `photo_url`/`photo_url_api`, `url`, `business_hours_weekly`, `location`, `category[]`, `detailed_category`, `comments`, `like_count`/`liked`, `rating`, `review_count`, `price_range`, `latitude/longitude`, `place_id`, `formatted_address`, `nearest_station_*`, `walk_time_from_station`, `user_id` 等
- 参照: `src/app/(features)/_lib/types.ts`

### 開発フロー/チェックリスト
- 新規機能
  - `src/app/(features)/<feature>` を作成し、`_components`/`_hooks`/`_lib` へ役割分割
  - サーバ API が必要なら `src/app/api/<name>/route.ts` を追加
  - 型定義は `types.ts` を拡張、サービスは既存パターン（`shopService.ts`/`userService.ts`）を踏襲
- 外部 API
  - API キーは環境変数管理。サーバ側でヘッダ付与、レート/エラー処理、必要に応じキャッシュ（Supabase）
- UI
  - Tailwind + shadcn/ui に準拠、アクセシビリティとレスポンシブ対応を確認
- DB
  - 変更は `supabase/migrations/*` の原子的 SQL。命名は説明的に
- コミット/PR
  - 小さく関連変更でまとめる。PR には概要/スクリーンショット/検証手順/関連 Issue を添付

### 既知の注意点
- 外部 API 呼び出しはネットワーク制限/鍵設定に依存。ローカル検証時は `.env.local` を整備
- 一部ファイルに文字化け由来コメントが残存の可能性。実装影響が無い範囲で随時修正

