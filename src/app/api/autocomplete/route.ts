import { NextResponse } from "next/server";

/**
 * Google Places Autocomplete APIを呼び出し、場所の候補を返すAPIルート
 * クライアントから入力文字列を受け取り、Google APIを利用してオートコンプリートの予測結果を返す。
 */
interface PlacePrediction {
  text: {
    text: string;
  };
  placeId: string;
}

interface AutocompleteSuggestion {
  placePrediction: PlacePrediction;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input"); // ユーザーが入力した検索文字列
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Google Maps APIキー

  // --- パラメータのバリデーション ---
  if (!input) {
    return NextResponse.json({ error: "Input is required" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured" },
      { status: 500 }
    );
  }

  const url = "https://places.googleapis.com/v1/places:autocomplete"; // Google Places Autocomplete APIのエンドポイント

  try {
    const response = await fetch(url, {
      method: "POST", // Autocomplete API (v1)はPOSTリクエスト
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey || "",
      },
      body: JSON.stringify({
        input: input,
        languageCode: "ja", // 日本語での結果を要求
        includedRegionCodes: ["jp"], // 日本国内に限定
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch from Google API", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // クライアントが使いやすいように、ここでデータ構造を整形する
    const predictions =
      data.suggestions?.map((suggestion: AutocompleteSuggestion) => ({
        description: suggestion.placePrediction.text.text,
        place_id: suggestion.placePrediction.placeId,
      })) || [];

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Server-side fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to fetch autocomplete suggestions",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
