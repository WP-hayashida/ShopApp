import { NextResponse } from "next/server";

const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * テキストアドレスを緯度・経度に変換するAPIルート (Geocoding API)
 * クライアントからテキストアドレスを受け取り、Google Geocoding APIを利用して
 * そのアドレスの緯度・経度を計算して返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address"); // ジオコーディング対象のアドレス文字列
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Google Maps APIキー

  // --- パラメータとAPIキーのバリデーション ---
  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
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
    const geocodingUrl = new URL(GEOCODING_API_URL);
    geocodingUrl.searchParams.append("address", address);
    geocodingUrl.searchParams.append("language", "ja"); // 日本語での結果を要求
    geocodingUrl.searchParams.append("key", apiKey);

    const response = await fetch(geocodingUrl.toString(), {
      cache: "no-store", // キャッシュを無効化
    });
    const data = await response.json();

    if (data.status !== "OK" || data.results.length === 0) {
      console.warn(
        "Geocoding failed or no results:",
        data.status,
        data.error_message
      );
      // ジオコーディングに失敗した場合は404を返す
      return NextResponse.json(
        {
          error: "Could not geocode address",
          status: data.status,
          message: data.error_message,
        },
        { status: 404 }
      );
    }

    const location = data.results[0].geometry.location; // 最初の結果の緯度・経度を取得
    return NextResponse.json({
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: data.results[0].formatted_address, // 整形された住所も返す
    });
  } catch (error) {
    console.error("Error in /api/geocode:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to geocode address", details: errorMessage },
      { status: 500 }
    );
  }
}
