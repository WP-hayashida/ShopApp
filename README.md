# ShopShare - お気に入りのお店共有アプリ

## 1. プロジェクト概要

ShopShareは、自分のお気に入りのお店や場所を記録し、他のユーザーと共有するためのWebアプリケーションです。「あのカフェ、もう一度行きたいけど名前を思い出せない…」「旅行先でおすすめの雑貨屋さんは？」といった日常の小さな困りごとを解決し、新しい発見のきっかけを提供することを目的としています。

## 2. 主な機能

- **ユーザー認証:** Googleアカウントを利用した簡単で安全なサインイン機能。
- **店舗情報の投稿・編集・削除:** Google Places APIと連携した強力な入力支援（オートコンプリート、最寄り駅・徒歩時間の自動計算）を含む、CRUD機能。
- **店舗一覧と高度な検索:** キーワード、場所（周辺検索）、カテゴリでの絞り込み、および新着順・いいね順でのソート機能。
- **いいね機能:** 気になるお店をブックマークする機能。
- **マイページ:** 自分の投稿や「いいね」したお店を一覧で管理。

## 3. 技術スタック

| カテゴリ          | 技術                                                                                                            |
| :---------------- | :-------------------------------------------------------------------------------------------------------------- |
| フレームワーク    | [Next.js](https://nextjs.org/) (App Router)                                                                     |
| 言語              | [TypeScript](https://www.typescriptlang.org/)                                                                   |
| データベース&認証 | [Supabase](https://supabase.com/)                                                                               |
| UIコンポーネント  | [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Vaul](https://vaul.emilkowal.ski/) |
| スタイリング      | [Tailwind CSS](https://tailwindcss.com/)                                                                        |
| 地図・位置情報    | [Google Maps Platform](https://cloud.google.com/maps-platform)                                                  |
| フォント          | [Geist](https://vercel.com/font)                                                                                |

## 4. アーキテクチャとプロジェクト構造

本プロジェクトは、Next.jsのApp Routerをベースに、関心事の分離と再利用性を高めるため、**Feature-Sliced Design**に似たディレクトリ構造を採用しています。

```
src
├── app
│   ├── (features)                # 各機能（ドメイン）ごとのルートとコンポーネント
│   │   ├── _components           # 機能間で共有されるUIコンポーネント
│   │   ├── _lib                  # 機能間で共有される型定義やヘルパー関数
│   │   ├── home                  # ホームページ（店舗一覧）
│   │   ├── my-page               # マイページ
│   │   ├── shops                 # 店舗詳細ページ
│   │   └── submit-shop           # 店舗投稿ページ
│   ├── api                     # サーバーサイドAPIルート
│   │   ├── autocomplete
│   │   ├── geocode
│   │   ├── placedetails
│   │   └── walk-time
│   └── layout.tsx                # ルートレイアウト
├── components                    # グローバルなUIコンポーネント
│   ├── ui                      # shadcn/uiによって生成された基本コンポーネント
│   └── StoreDetail.tsx         # カスタムUIコンポーネントの例
├── context                       # Reactコンテキスト
│   └── SearchContext.tsx       # 検索状態をグローバルに管理
└── lib                           # プロジェクト全体のコアロジック
    ├── supabase                # Supabaseクライアントの初期化
    └── types                   # データベース全体の型定義
```

### 各ディレクトリの責務

- **`src/app/(features)/`**: アプリケーションの主要な機能（ドメイン）ごとに分割されています。各機能は自身のルート(`page.tsx`)、コンポーネント、ロジックを持ち、他の機能からの独立性が高められています。
  - **`_components`**: `FilterableShopList`や`ShopCard`など、複数の機能ページで再利用される、やや大きめのUIコンポーネントを配置します。
  - **`_lib`**: 機能間で共有される型定義(`types.ts`)やヘルパー関数(`shopUtils.ts`)を配置します。
- **`src/app/api/`**: Google Maps Platform APIのキーを安全にサーバーサイドで管理するためのプロキシとして機能します。各APIルートは特定の責務を持ちます。
  - **`autocomplete`**: Google Places Autocomplete APIを呼び出し、場所の入力候補を返します。
  - **`geocode`**: テキストの住所を緯度・経度に変換します。
  - **`placedetails`**: Supabaseのキャッシュを確認し、なければGoogle Places Details APIから店舗詳細を取得します。
  - **`walk-time`**: 指定された緯度・経度から最寄り駅と徒歩時間を計算します。
- **`src/components/`**: `Button`や`Input`のような基本的なUI部品（`ui/`）と、それらを組み合わせて作られた、より具体的なカスタムコンポーネント（`StoreDetail.tsx`など）を配置します。
- **`src/context/`**: アプリケーション全体で共有・利用される状態（例: 検索キーワード）を管理します。
- **`src/lib/`**: Supabaseクライアントのセットアップや、データベース全体の型定義ファイル(`database.types.ts`)など、プロジェクトの基盤となるコードを配置します。

## 5. 主要なロジックと実装の詳細

### 1. 認証フロー

Supabase Authを利用し、Google OAuthプロバイダーによる認証を実装しています。セッション管理は`@supabase/ssr`パッケージによって自動化されており、クライアントコンポーネントとサーバーコンポーネント間で認証状態が安全に共有されます。

### 2. 店舗データの取得とキャッシュ戦略 (`/api/placedetails`)

店舗詳細データの取得は、APIコストの削減と表示速度の向上を両立させるため、以下のハイブリッド戦略を採用しています。

1.  **キャッシュ確認:** まず、Supabaseの`shops`テーブルに、リクエストされた`place_id`を持つデータが存在し、かつ最終更新から24時間以内かを確認します。
2.  **キャッシュヒット:** データが新しければ、データベースから直接データを返します。
3.  **キャッシュミス:** データが存在しないか古い場合、Googleの**Places API (New)**を呼び出して最新の情報を取得します。
4.  **キャッシュ更新:** 取得した最新情報を`shops`テーブルに`upsert`（存在すれば更新、なければ挿入）し、クライアントに返します。これにより、次回以降の同じリクエストはキャッシュから高速に返されます。

### 3. 高度な検索機能 (`search_shops` RPC)

キーワード、場所（周辺）、カテゴリといった複数の条件を組み合わせた複雑な検索は、Supabaseの**RPC (Remote Procedure Call)** 機能を利用して、すべてサーバーサイドで実行されます。

- **`public.search_shops`関数:** PostgreSQLで定義されたこのデータベース関数は、以下の責務を持ちます。
  - **キーワード検索:** `ILIKE`を使用して、店名、コメント、最寄り駅名など複数のカラムを対象に部分一致検索を行います。
  - **周辺検索:** `PostGIS`拡張機能を利用し、指定された緯度・経度から半径`search_radius`メートル以内にある店舗を効率的に絞り込みます。
  - **動的ソート:** `sort_by`引数（`created_at.desc`など）に応じて、`CASE`文で並び替え順を動的に変更します。
  - **リッチなデータ返却:** `JOIN`やサブクエリを用いて、店舗情報に加えて、投稿者情報(`profiles`)、いいね数、現在のユーザーがいいね済みかどうかのフラグなどを一度のクエリで計算し、クライアントに返します。

このアーキテクチャにより、クライアントは複雑なロジックを意識することなく、単一のAPIコールで必要なデータをすべて取得できます。

### 4. 店舗投稿フロー (`submit-shop`ページ)

ユーザーが新しい店舗を投稿する際には、複数のGoogle Maps Platform APIが連携して動作し、データ入力を強力に支援します。

1.  **入力支援 (`/api/autocomplete`):** ユーザーが店名を入力すると、Places Autocomplete APIが候補を提示します。
2.  **詳細情報取得 (`/api/placedetails`):** 候補を選択すると、`place_id`を元にPlaces Details APIが店の正式名称、住所、評価、カテゴリ（`types`）などを自動入力します。
3.  **最寄り駅計算 (`/api/walk-time`):** 取得した緯度・経度を元に、Nearby Search APIで最寄り駅を検索し、Directions APIでそこからの徒歩時間を計算します。
4.  **データ保存:** ユーザーが入力した情報と、APIから自動取得した情報を合わせて、Supabaseの`shops`テーブルに保存します。

## 6. データベーススキーマ

SupabaseのPostgreSQLデータベースには、主に以下のテーブルがあります。（詳細は既存のREADMEセクションを参照）

- `profiles`: ユーザープロフィール
- `shops`: 店舗情報
- `likes`: いいね情報
- `ratings`: 評価情報
- `reviews`: レビュー情報

## 7. 環境設定と利用開始方法

1.  **環境変数の設定:**
    プロジェクトのルートに`.env.local`ファイルを作成し、必要なAPIキーなどを設定します。

    ```.env.local
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
    ```

2.  **GCP & Supabaseのセットアップ:**
    - **Google Cloud Platform:** `Places API`, `Geocoding API`, `Directions API`を有効化してください。
    - **Supabase:** `PostGIS`拡張機能を有効にし、スキーマとRPC関数（セクション4, 5参照）を設定してください。

3.  **依存関係のインストールと開発サーバーの起動:**

    ```bash
    npm install
    npm run dev
    ```

    ブラウザで `http://localhost:3000` を開いてください。