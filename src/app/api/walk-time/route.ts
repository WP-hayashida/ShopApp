import { NextResponse } from "next/server";

const PLACES_NEARBY_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchNearby";
const DIRECTIONS_API_URL =
  "https://maps.googleapis.com/maps/api/directions/json";

/**
 * 最寄り駅とそこからの徒歩時間を計算するAPIルート
 * クライアントから店舗の緯度・経度を受け取り、Google Maps Platform APIを利用して最寄り駅を特定し、
 * その駅からの徒歩時間を計算して返す。
 */
export async function GET(request: Request) {
  console.log("[/api/walk-time] --- Request received ---");

  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat"); // 店舗の緯度
  const lngStr = searchParams.get("lng"); // 店舗の経度
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Google Maps APIキー

  // --- パラメータとAPIキーのバリデーション ---
  if (!latStr || !lngStr) {
    console.error(
      "[/api/walk-time] Error: Latitude and longitude are required"
    );
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }
  if (!apiKey) {
    console.error(
      "[/api/walk-time] Error: Google Maps API key is not configured"
    );
    return NextResponse.json(
      { error: "Google Maps API key is not configured" },
      { status: 500 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  try {
    // --- ステップ1: 最寄り駅の検索 (Places API (New) Nearby Search) ---
    console.log("[/api/walk-time] --- 1. Starting Nearby Search (v1) ---");
    const nearbySearchResponse = await fetch(PLACES_NEARBY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "x-goog-fieldmask": "places.displayName,places.location", // 必要なフィールドを明記
      },
      body: JSON.stringify({
        languageCode: "ja",
        includedTypes: ["train_station"], // 鉄道駅を対象
        maxResultCount: 1, // 必要なのは最も近い1件のみ
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: 1500.0, // 半径1.5kmで検索
          },
        },
      }),
      cache: "no-store", // キャッシュを無効化
    });

    const nearbySearchData = await nearbySearchResponse.json();

    if (
      !nearbySearchResponse.ok ||
      !nearbySearchData.places ||
      nearbySearchData.places.length === 0
    ) {
      console.warn(
        "[/api/walk-time] No nearby stations found with v1 API. Status:",
        nearbySearchResponse.status,
        "Response:",
        nearbySearchData
      );
      // 最寄り駅が見つからない場合は404を返す
      return NextResponse.json(
        { error: "No nearby stations found" },
        { status: 404 }
      );
    }

    const nearestStation = nearbySearchData.places[0];
    const stationLocation = nearestStation.location; // v1ではlocationに緯度経度が入る
    const stationName = nearestStation.displayName.text; // v1ではdisplayName.textに名前が入る
    console.log(`[/api/walk-time] Found nearest station: ${stationName}`);

    // --- ステップ2: 徒歩時間の計算 (Directions API) ---
    console.log("[/api/walk-time] --- 2. Starting Directions Search ---");
    const directionsUrl = new URL(DIRECTIONS_API_URL);
    directionsUrl.searchParams.append(
      "origin",
      `${stationLocation.latitude},${stationLocation.longitude}`
    );
    directionsUrl.searchParams.append("destination", `${lat},${lng}`);
    directionsUrl.searchParams.append("mode", "walking"); // 徒歩モード
    directionsUrl.searchParams.append("language", "ja");
    directionsUrl.searchParams.append("key", apiKey);

    const directionsResponse = await fetch(directionsUrl.toString(), {
      cache: "no-store", // キャッシュを無効化
    });
    const directionsData = await directionsResponse.json();

    if (directionsData.status !== "OK" || directionsData.routes.length === 0) {
      console.error(
        "[/api/walk-time] Could not calculate walking directions. Status:",
        directionsData.status
      );
      // 経路計算に失敗した場合は500を返す
      return NextResponse.json(
        { error: "Could not calculate walking directions" },
        { status: 500 }
      );
    }

    const leg = directionsData.routes[0].legs[0]; // 最初のルートの最初の区間
    const walkTimeInMinutes = Math.ceil(leg.duration.value / 60); // 秒を分に変換し、切り上げ
    console.log(
      `[/api/walk-time] Calculated walk time: ${walkTimeInMinutes} minutes`
    );

    // --- ステップ3: 結果を返す ---
    console.log("[/api/walk-time] --- 3. Returning success response ---");
    return NextResponse.json({
      stationName,
      walkTime: walkTimeInMinutes,
    });
  } catch (error) {
    console.error("[/api/walk-time] CATCH BLOCK ERROR:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch walking time", details: errorMessage },
      { status: 500 }
    );
  }
}
