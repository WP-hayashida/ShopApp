import { NextResponse } from "next/server";

const PLACES_NEARBY_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchNearby";
const DIRECTIONS_API_URL =
  "https://maps.googleapis.com/maps/api/directions/json";

// Define interfaces for the Google Places API response
interface Place {
  location: {
    latitude: number;
    longitude: number;
  };
  displayName: {
    text: string;
    languageCode: string;
  };
}

interface NearbySearchResponse {
  places: Place[];
}

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
    // --- ステップ1: 最寄り駅の検索 (Get multiple candidates and find closest) ---
    console.log("[/api/walk-time] --- 1. Starting Nearby Search (Radius) ---");
    const nearbySearchResponse = await fetch(PLACES_NEARBY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "x-goog-fieldmask": "places.displayName,places.location",
      },
      body: JSON.stringify({
        languageCode: "ja",
        includedTypes: ["train_station", "subway_station", "light_rail_station"],
        maxResultCount: 5, // Fetch multiple candidates
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: 2000.0, // 2km radius
          },
        },
      }),
      cache: "no-store",
    });

    const nearbySearchData: NearbySearchResponse = await nearbySearchResponse.json();

    if (
      !nearbySearchResponse.ok ||
      !nearbySearchData.places ||
      nearbySearchData.places.length === 0
    ) {
      console.warn(
        "[/api/walk-time] No nearby stations found. Status:",
        nearbySearchResponse.status,
        "Response:",
        nearbySearchData
      );
      return NextResponse.json(
        { error: "No nearby stations found" },
        { status: 404 }
      );
    }

    // Find the closest station from the results by calculating distance
    let closestStation: Place | null = null;
    let minDistanceSq = Infinity;

    for (const place of nearbySearchData.places) {
      const placeLat = place.location.latitude;
      const placeLng = place.location.longitude;
      const distanceSq =
        Math.pow(lat - placeLat, 2) + Math.pow(lng - placeLng, 2);
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closestStation = place;
      }
    }

    if (!closestStation) {
      return NextResponse.json(
        { error: "Could not determine closest station" },
        { status: 404 }
      );
    }

    const stationLocation = closestStation.location;
    const stationName = closestStation.displayName.text;
    console.log(`[/api/walk-time] Found closest station: ${stationName}`);

    // --- ステップ2: 徒歩時間の計算 (Directions API) ---
    console.log("[/api/walk-time] --- 2. Starting Directions Search ---");
    const directionsUrl = new URL(DIRECTIONS_API_URL);
    directionsUrl.searchParams.append(
      "origin",
      `${stationLocation.latitude},${stationLocation.longitude}`
    );
    directionsUrl.searchParams.append("destination", `${lat},${lng}`);
    directionsUrl.searchParams.append("mode", "walking");
    directionsUrl.searchParams.append("language", "ja");
    directionsUrl.searchParams.append("key", apiKey);

    const directionsResponse = await fetch(directionsUrl.toString(), {
      cache: "no-store",
    });
    const directionsData = await directionsResponse.json();

    if (directionsData.status !== "OK" || directionsData.routes.length === 0) {
      console.error(
        "[/api/walk-time] Could not calculate walking directions. Status:",
        directionsData.status
      );
      return NextResponse.json(
        { error: "Could not calculate walking directions" },
        { status: 500 }
      );
    }

    const leg = directionsData.routes[0].legs[0];
    const walkTimeInMinutes = Math.ceil(leg.duration.value / 60);
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
