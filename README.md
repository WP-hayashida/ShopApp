# ShopShare - お気に入りのお店共有アプリ

## 1. プロジェクト概要

ShopShare は、自分のお気に入りのお店や場所を記録し、他のユーザーと共有するための Web アプリケーションです。「あのカフェ、もう一度行きたいけど名前を思い出せない…」「旅行先でおすすめの雑貨屋さんは？」といった日常の小さな困りごとを解決し、新しい発見のきっかけを提供することを目的としています。

ユーザーは Google アカウントで簡単にログインでき、直感的な操作でお店の情報を投稿・管理できます。他のユーザーの投稿を参考にしたり、「いいね」でお気に入りをストックしたりすることも可能です。

## 2. 主な機能

本アプリケーションが提供する主な機能は以下の通りです。

- **ユーザー認証:**

  - Google アカウント連携による、安全で簡単なサインイン・サインアウト機能。
  - 認証状態はヘッダーに表示され、セッション管理は Supabase Auth が担います。

- **お店の投稿・編集・削除:**

  - お店の名前、写真、カテゴリ、営業時間、コメントなどの詳細情報を投稿できます。
  - **Google Places Autocomplete** を利用した場所入力支援。
  - 投稿時に**Geocoding API**で緯度・経度を自動取得し、**最寄り駅とそこからの徒歩時間**も自動計算して保存します。
  - 写真は Supabase Storage にアップロードされ、URL がデータベースに保存されます。
  - 自分が投稿したお店は、後から情報を編集したり、投稿自体を削除したりすることが可能です。

- **一覧表示と検索・ソート:**

  - トップページでは、投稿されたすべてのお店がカード形式で一覧表示されます。
  - **サーバーサイド検索**により、データベース全体を対象とした検索が可能です。
  - **キーワード検索**（店名、コメント、詳細カテゴリ、**最寄り駅名**）
  - **場所検索（周辺検索）:**
    - **Google Places Autocomplete** を利用した場所入力支援。
    - 入力された地名から**Geocoding API**で緯度・経度を自動取得し、その座標を中心とした**半径検索**（デフォルト2km）を行います。
  - カテゴリによる絞り込み検索が可能です。
  - 検索結果は「新着順」「古い順」「いいね順」で並び替えることができます。

- **お店の詳細表示:**
  - Googleマップへのリンク表示。
  - 最寄り駅からの徒歩時間表示。

- **いいね機能:**

  - 各お店のカードにあるハートアイコンをクリックすることで、簡単に「いいね」の付け外しができます。
  - いいねの数はリアルタイムでカウントされ、表示に反映されます。

- **マイページ:**
  - タブ形式の UI で「プロフィール」「投稿したお店」「お気に入りのお店」を切り替えて表示します。
  - プロフィール（ニックネーム、アバター URL）を編集できます。
  - 自分が投稿したお店、いいねしたお店のそれぞれに対して、一覧表示と検索・ソート機能を利用できます。
  - お店のリストは初期状態で 1 行のみ表示され、「さらに表示」ボタンで全件を閲覧できる UI になっています。

## 3. 技術スタックと選定理由

| カテゴリ          | 技術                                                                                                            | 選定理由 -                                                                                                                                                                                                                                     |
| :---------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| フレームワーク    | [Next.js](https://nextjs.org/) (App Router)                                                                     | React ベースの高い開発者体験と、サーバーサイドレンダリング(SSR)や静的サイト生成(SSG)などの豊富な機能を提供するため。App Router による最新のルーティングとレイアウト管理の恩恵も受けられます。 -                                                |
| 言語              | TypeScript                                                                                                      | 静的型付けによる開発時のエラー検出とコード補完の強化により、コードの品質とメンテナンス性を向上させるため。 -                                                                                                                                   |
| データベース&認証 | [Supabase](https://supabase.com/)                                                                               | PostgreSQL データベース、認証、ストレージ、リアルタイム機能をオールインワンで提供し、バックエンド開発を大幅に簡素化できるため。手軽に始められ、スケールも可能です。 -                                                                          |
| UI コンポーネント | [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Vaul](https://vaul.emilkowal.ski/) | shadcn/ui は、コピー&ペーストでプロジェクトに導入できる再利用可能なコンポーネント群です。内部的に Radix UI を使用しており、アクセシビリティとカスタマイズ性に優れています。Vaul はモバイルフレンドリーなドロワーコンポーネントを提供します。 - |
| スタイリング      | [Tailwind CSS](https://tailwindcss.com/)                                                                        | ユーティリティファーストなアプローチにより、HTML から離れることなく迅速に UI を構築できるため。 -                                                                                                                                              |
| フォント          | [Geist](https://vercel.com/font)                                                                                | Vercel によって開発されたモダンで可読性の高いフォントファミリー。Next.js との親和性が高いです。 -                                                                                                                                              |

## 4. セットアップと起動方法

1.  **環境変数の設定:**
    プロジェクトのルートに `.env.local` ファイルを作成し、Supabase から取得したプロジェクト URL と Anon キー、および Google Maps Platform の API キーを設定します。

    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
    ```

2.  **Google Cloud Platform (GCP) APIの有効化:**
    以下のGoogle Maps Platform APIを有効にする必要があります。
    -   **Places API (New)**: オートコンプリート、場所の詳細取得、周辺検索に利用。
    -   **Geocoding API**: テキストアドレスから緯度・経度への変換に利用。
    -   **Directions API**: 最寄り駅からの徒歩時間計算に利用。
    各APIは[Google Cloud Console](https://console.cloud.google.com/)の「APIとサービス」>「ライブラリ」から有効化してください。また、プロジェクトに**請求先アカウントがリンクされている**必要があります。

3.  **PostgreSQL拡張機能の有効化:**
    SupabaseのSQL Editorで以下のSQLを実行し、地理空間検索に必要なPostGIS拡張機能を有効化します。
    ```sql
    CREATE EXTENSION IF NOT EXISTS postgis;
    ```

4.  **データベーススキーマの更新:**
    `shops`テーブルに以下の列を追加し、`geog`列の自動更新トリガーを設定します。
    ```sql
    ALTER TABLE public.shops ADD COLUMN latitude float8;
    ALTER TABLE public.shops ADD COLUMN longitude float8;
    ALTER TABLE public.shops ADD COLUMN nearest_station_name text;
    ALTER TABLE public.shops ADD COLUMN walk_time_from_station integer;
    ALTER TABLE public.shops ADD COLUMN geog geography(Point, 4326);

    UPDATE public.shops SET geog = ST_MakePoint(longitude, latitude)::geography WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

    CREATE INDEX shops_geog_idx ON public.shops USING GIST (geog);

    CREATE OR REPLACE FUNCTION update_shops_geog()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
            NEW.geog = ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_shops_geog
    BEFORE INSERT OR UPDATE ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION update_shops_geog();
    ```

5.  **`search_shops`データベース関数の設定:**
    SupabaseのSQL Editorで、`search_shops`関数を以下の定義で作成または更新します。
    ```sql
    CREATE OR REPLACE FUNCTION public.search_shops(
      category_filter text[],
      keyword text,
      search_lat float8,
      search_lng float8,
      search_radius integer,
      sort_by text,
      current_user_id uuid
    )
    RETURNS TABLE(
      id uuid,
      created_at timestamptz,
      name text,
      photo_url text,
      url text,
      business_hours text,
      location text,
      latitude float8,
      longitude float8,
      category text[],
      detailed_category text,
      comments text,
      user_id uuid,
      nearest_station_name text,
      walk_time_from_station integer,
      searchable_categories_text text,
      username text,
      avatar_url text,
      like_count bigint,
      liked boolean,
      rating float8,
      review_count integer
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        s.id,
        s.created_at,
        s.name,
        s.photo_url,
        s.url,
        s.business_hours,
        s.location,
        s.latitude,
        s.longitude,
        s.category,
        s.detailed_category,
        s.comments,
        s.user_id,
        s.nearest_station_name,
        s.walk_time_from_station,
        s.searchable_categories_text,
        p.username,
        p.avatar_url,
        (SELECT COUNT(*) FROM public.likes l WHERE l.shop_id = s.id) AS like_count,
        (CASE WHEN current_user_id IS NOT NULL THEN EXISTS(SELECT 1 FROM public.likes l WHERE l.shop_id = s.id AND l.user_id = current_user_id) ELSE FALSE END) AS liked,
        (SELECT AVG(r.rating) FROM public.ratings r WHERE r.shop_id = s.id)::float8 AS rating,
        (SELECT COUNT(*) FROM public.reviews r WHERE r.shop_id = s.id)::integer AS review_count
      FROM
        public.shops s
      LEFT JOIN
        public.profiles p ON s.user_id = p.id
      WHERE
        (category_filter IS NULL OR category_filter = '{}' OR s.category && category_filter)
        AND (keyword IS NULL OR keyword = '' OR s.searchable_categories_text ILIKE '%' || keyword || '%' OR s.name ILIKE '%' || keyword || '%' OR s.nearest_station_name ILIKE '%' || keyword || '%')
        AND (search_lat IS NULL OR search_lng IS NULL OR search_radius IS NULL OR
             ST_DWithin(s.geog, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography, search_radius))
      ORDER BY
        CASE
            WHEN sort_by = 'created_at.desc' THEN s.created_at
            ELSE NULL
        END DESC,
        CASE
            WHEN sort_by = 'created_at.asc' THEN s.created_at
            ELSE NULL
        END ASC,
        CASE
            WHEN sort_by = 'likes.desc' THEN (SELECT COUNT(*) FROM public.likes l WHERE l.shop_id = s.id)
            ELSE NULL
        END DESC;
    END;
    $$ LANGUAGE plpgsql;
    ```

6.  **依存関係のインストール:**

    ```bash
    npm install
    ```

7.  **開発サーバーの起動:**

    ```bash
    npm run dev
    ```

    ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 5. データベーススキーマ

Supabase の PostgreSQL データベースには、主に以下のテーブルがあります。

### `profiles` テーブル

ユーザーのプロフィール情報を格納します。Supabase の`auth.users`テーブルと 1 対 1 の関係にあります。

| カラム名     | 型                   | 説明                                |
| :----------- | :------------------- | :---------------------------------- |
| `id`         | `uuid` (Primary Key) | ユーザー ID (`auth.users.id`と一致) |
| `username`   | `text`               | ユーザーのニックネーム              |
| `avatar_url` | `text`               | アバター画像の URL                  |
| `created_at` | `timestamptz`        | 作成日時                            |
| `updated_at` | `timestamptz`        | 更新日時                            |

### `shops` テーブル

投稿されたお店の情報を格納します。

| カラム名                   | 型                       | 説明                                    |
| :------------------------- | :----------------------- | :-------------------------------------- |
| `id`                       | `uuid` (Primary Key)     | 店舗の一意な ID                         |
| `user_id`                  | `uuid` (Foreign Key)     | 投稿したユーザーの ID                   |
| `name`                     | `text`                   | 店舗名                                  |
| `photo_url`                | `text`                   | 写真の URL                              |
| `url`                      | `text`                   | 関連 URL                                |
| `business_hours`           | `text`                   | 営業時間                                |
| `location`                 | `text`                   | 場所（オートコンプリートのdescription） |
| `latitude`                 | `float8`                 | 緯度                                    |
| `longitude`                | `float8`                 | 経度                                    |
| `geog`                     | `geography(Point, 4326)` | 地理空間検索用の位置情報                |
| `nearest_station_name`     | `text`                   | 最寄り駅名                              |
| `walk_time_from_station`   | `integer`                | 最寄り駅からの徒歩時間（分）            |
| `category`                 | `text[]`                 | 大カテゴリ（配列）                      |
| `detailed_category`        | `text`                   | 詳細カテゴリ                            |
| `comments`                 | `text`                   | コメント                                |
| `created_at`               | `timestamptz`            | 作成日時                                |
| `searchable_categories_text` | `text`                   | 検索用カテゴリテキスト                  |

### `likes` テーブル

どのお店をどのユーザーがいいねしたかを記録する中間テーブルです。

| カラム名     | 型                     | 説明                    |
| :----------- | :--------------------- | :---------------------- |
| `id`         | `bigint` (Primary Key) | いいねの一意な ID       |
| `user_id`    | `uuid` (Foreign Key)   | いいねしたユーザーの ID |
| `shop_id`    | `uuid` (Foreign Key)   | いいねされたお店の ID   |
| `created_at` | `timestamptz`          | 作成日時                |

### `ratings` テーブル

ユーザーによるお店の評価を格納します。

| カラム名     | 型                     | 説明                    |
| :----------- | :--------------------- | :---------------------- |
| `id`         | `uuid` (Primary Key)   | 評価の一意な ID         |
| `user_id`    | `uuid` (Foreign Key)   | 評価したユーザーの ID   |
| `shop_id`    | `uuid` (Foreign Key)   | 評価されたお店の ID     |
| `rating`     | `integer`              | 評価点数（例: 1〜5）    |
| `created_at` | `timestamptz`          | 作成日時                |

### `reviews` テーブル

ユーザーによるお店のレビューを格納します。

| カラム名     | 型                     | 説明                    |
| :----------- | :--------------------- | :---------------------- |
| `id`         | `uuid` (Primary Key)   | レビューの一意な ID     |
| `user_id`    | `uuid` (Foreign Key)   | レビューしたユーザーの ID |
| `shop_id`    | `uuid` (Foreign Key)   | レビューされたお店の ID   |
| `comment`    | `text`                 | レビューコメント        |
| `created_at` | `timestamptz`          | 作成日時                |

## 6. 主要なロジック解説

### 1. 認証フロー

- **サインイン:**
  1.  ユーザーが「Google でサインイン」ボタンをクリックします。
  2.  Supabase の `signInWithOAuth` メソッドが呼び出され、Google の認証ページにリダイレクトされます。
  3.  認証が成功すると、Supabase は指定されたコールバック URL (`/auth/callback`) にリダイレクトし、URL に認証コードを付与します。
- **コールバック処理:**
  1.  `src/app/auth/callback/route.ts` がリクエストを受け取ります。
  2.  URL から認証コードを取得し、Supabase の `exchangeCodeForSession` メソッドを使用してセッション（ユーザー情報とトークン）と交換します。
  3.  セッションの取得が成功すると、ユーザーはホームページにリダイレクトされます。
- **セッション管理:**
  - 取得されたセッション情報はブラウザのクッキーに安全に保存されます。
  - クライアントサイド (`client.ts`) とサーバーサイド (`server.ts`) の Supabase クライアントは、このクッキーを自動的に読み書きし、認証状態を維持します。
  - `onAuthStateChange` リスナーを使用して、サインインやサインアウトといった認証状態の変化を検知し、UI をリアルタイムに更新します。

### 2. お店の投稿機能 (`src/app/(features)/submit-shop/page.tsx`)

- **Google Places API連携:**
  - 店舗名入力時に**Places API Autocomplete**で候補を表示します。
  - 候補選択時、または場所のフリーワード入力時に**Geocoding API**で緯度・経度を取得します。
  - 投稿時には、取得した緯度・経度を元に**Directions API**で最寄り駅と徒歩時間を計算し、データベースに保存します。
- **写真アップロード:**
  - 選択された写真はSupabase Storageにアップロードされ、そのURLがデータベースに保存されます。
- **データ保存:**
  - 店舗名、場所（オートコンプリートのdescription）、緯度・経度、最寄り駅情報、カテゴリ、営業時間、コメントなどをSupabaseの`shops`テーブルに保存します。

### 3. 検索・ソート機能 (`src/app/(features)/home/HomePageClient.tsx` & `src/app/(features)/_components/SearchControls.tsx`)

- **サーバーサイド検索:**
  - 検索条件が変更されるたびに、`HomePageClient.tsx`がSupabaseの**`search_shops` RPC関数**を呼び出し、データベース全体からフィルタリング・ソートされた結果を取得します。
  - これにより、大規模なデータセットでも高速かつ正確な検索が可能です。
- **検索条件:**
  - **キーワード:** 店名、詳細カテゴリ、コメント、検索用カテゴリテキスト、**最寄り駅名**を対象としたフリーワード検索。
  - **場所（周辺検索）:**
    - `SearchControls.tsx`の場所入力欄で、**Google Places Autocomplete**による入力支援。
    - 候補選択時、またはフリーワード入力時に**Geocoding API**で緯度・経度を取得。
    - 取得した緯度・経度を中心とした**半径検索**（デフォルト2km）をデータベースのPostGIS機能で実行。
  - **カテゴリ:** 複数選択可能なカテゴリによる絞り込み。
- **ソート:**
  - 「新着順」「古い順」「いいね順」で動的に結果を並び替えることが可能です。

### 4. APIルート (`src/app/api/...`) の役割

- **`/api/autocomplete`:**
  - Google Places Autocomplete APIを呼び出し、場所の入力候補をクライアントに提供します。
  - APIキーをサーバーサイドで安全に管理し、日本語での結果を要求します。
- **`/placedetails`:**
  - Google Places API (New)を呼び出し、`placeId`から場所の表示名、整形済み住所、緯度・経度などの詳細情報を取得します。
  - APIキーをサーバーサイドで安全に管理し、日本語での結果を要求します。
- **`/api/geocode`:**
  - Google Geocoding APIを呼び出し、テキストアドレス（例: 「東京タワー」）を緯度・経度に変換します。
  - フリーワードでの場所検索の際に、オートコンプリート候補が選択されなかった場合のフォールバックとして利用されます。
- **`/api/walk-time`:**
  - Google Places API (New)で最寄り駅を検索し、Google Directions APIでその駅からの徒歩時間を計算します。
  - 店舗投稿時や詳細表示時に利用され、最寄り駅名と徒歩時間を返します。

### 5. データベース関数 (`public.search_shops`) の役割

- **高機能検索:**
  - キーワード、カテゴリ、**緯度・経度・半径**（PostGIS利用）による複合的な検索を効率的に実行します。
  - ユーザー情報（`profiles`テーブルとのJOIN）、いいね数、いいね済みフラグ、評価、レビュー数などのリッチなデータを一度に返します。
  - `sort_by`パラメータに応じて、結果を動的に並び替えます。

## 7. 開発環境

- **Next.js:** 14.x
- **React:** 18.x
- **TypeScript:** 5.x
- **Supabase CLI:** 1.x
- **Node.js:** 18.x または 20.x

## 8. 貢献

このプロジェクトへの貢献を歓迎します。バグ報告や機能提案は GitHub Issues までお願いします。