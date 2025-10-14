import { NextResponse } from "next/server";

/**
 * Google Places API (New)から場所の詳細情報を取得するAPIルート
 * クライアントからplaceIdを受け取り、その場所の表示名、整形済み住所、緯度経度を返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId"); // Google Places APIの場所ID
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Google Maps APIキー

  // --- パラメータのバリデーション ---
  if (!placeId) {
    return NextResponse.json(
      { error: "Place ID is required" },
      { status: 400 }
    );
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured" },
      { status: 500 }
    );
  }

  try {
    // Places API (New)では `places/{placeId}` という形式のURLになる
    const url = `https://places.googleapis.com/v1/places/${placeId}`;

    // 必要なフィールドを`fields`パラメータで指定する (FieldMaskとして機能)
    const fields = "displayName,formattedAddress,location";

    const response = await fetch(`${url}?fields=${fields}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey || "",
        "Accept-Language": "ja", // 日本語での結果を要求
      },
    });

    const data = await response.json();
    // APIからのエラーレスポンスも適切に処理
    if (!response.ok) {
      console.error("Error from Google Places API:", data);
      return NextResponse.json(
        {
          error:
            data.error?.message || "Failed to fetch place details from Google",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ place: data });
  } catch (error) {
    console.error("Error in /placedetails:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
