import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Json } from '@/lib/database.types'; // Import Json type

// Define a type for the structured business hours
interface BusinessHours {
  day: string;
  time: string;
}

// Define a type for the shop data to be stored/returned
interface ShopData {
  place_id: string | null; // Can be null from DB
  name: string;
  price_range?: string | null; // Can be null from DB
  business_hours_weekly?: BusinessHours[] | null; // Can be null from DB
  rating?: number | null; // Can be null from DB
  phone_number?: string | null; // Can be null from DB
  photo_url_api?: string | null; // Can be null from DB
  api_last_updated: string | null; // Can be null from DB
  types?: string[] | null; // Add types field
  // Add other fields as needed
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const CACHE_DURATION_HOURS = 24; // Cache duration

  try {
    // 1. Check cache (Supabase)
    const { data: cachedShop, error: cacheError } = await supabase
      .from('shops')
      .select(`
        *,
        api_last_updated,
        price_range,
        business_hours_weekly,
        phone_number,
        photo_url_api,
        types // Add types here
      `)
      .eq('place_id', placeId)
      .single();

    if (cachedShop && !cacheError) {
      if (cachedShop.api_last_updated) {
        const lastUpdated = new Date(cachedShop.api_last_updated);
        const now = new Date();
        const hoursDiff = Math.abs(now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < CACHE_DURATION_HOURS) {
          console.log(`Returning cached data for place_id: ${placeId}`);
          const responseData: ShopData = {
            place_id: cachedShop.place_id,
            name: cachedShop.name,
            price_range: cachedShop.price_range,
            business_hours_weekly: cachedShop.business_hours_weekly as BusinessHours[] | null,
            rating: cachedShop.rating,
            phone_number: cachedShop.phone_number,
            photo_url_api: cachedShop.photo_url_api,
            api_last_updated: cachedShop.api_last_updated,
            types: cachedShop.types as string[] | null, // Add types here
          };
          return NextResponse.json(responseData);
        }
      }
    }

    // 2. Fetch from Google Places API (New) if cache is missed or stale
    console.log(`Fetching fresh data from Google Places API (New) for place_id: ${placeId}`);
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API Key is not set');
    }

    const googlePlacesUrl = `https://places.googleapis.com/v1/places/${placeId}?languageCode=ja`;    const fieldMask = 'displayName,regularOpeningHours,rating,photos,internationalPhoneNumber,priceLevel,types';

    const googleResponse = await fetch(googlePlacesUrl, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    const googleData = await googleResponse.json();

    if (googleData.error) {
        console.error('Google Places API Error:', googleData.error);
        return NextResponse.json({ error: googleData.error.message || 'Failed to fetch from Google Places API' }, { status: googleData.error.code || 500 });
    }

    const result = googleData;

    // Process Google Places API (New) response
    const businessHoursWeekly: BusinessHours[] = result.regularOpeningHours?.weekdayDescriptions?.map((text: string) => {
      const [day, ...timeParts] = text.split('：'); // Note: Using full-width colon for splitting Japanese text
      return { day: day.trim(), time: timeParts.join('：').trim() };
    }) || [];

    const photoUrl = result.photos && result.photos.length > 0
      ? `https://places.googleapis.com/v1/${result.photos[0].name}/media?maxHeightPx=400&key=${GOOGLE_PLACES_API_KEY}`
      : undefined;

    const priceLevelMap: { [key: string]: string } = {
        'PRICE_LEVEL_FREE': '無料',
        'PRICE_LEVEL_INEXPENSIVE': '¥',
        'PRICE_LEVEL_MODERATE': '¥¥',
        'PRICE_LEVEL_EXPENSIVE': '¥¥¥',
        'PRICE_LEVEL_VERY_EXPENSIVE': '¥¥¥¥',
    };
    const priceRange = result.priceLevel ? priceLevelMap[result.priceLevel] : null;

    const shopName = typeof result.displayName === 'object' && result.displayName !== null
      ? result.displayName.text
      : result.displayName;

    const newShopData: ShopData = {
      place_id: placeId,
      name: shopName,
      price_range: priceRange,
      business_hours_weekly: businessHoursWeekly.length > 0 ? businessHoursWeekly : null,
      rating: result.rating ?? null,
      phone_number: result.internationalPhoneNumber ?? null,
      photo_url_api: photoUrl ?? null,
      api_last_updated: new Date().toISOString(),
      types: result.types || null, // Include types here
    };

    // 3. Update cache (Supabase)
    const { error: upsertError } = await supabase
      .from('shops')
      .upsert(
        {
          place_id: newShopData.place_id,
          name: newShopData.name,
          price_range: newShopData.price_range,
          business_hours_weekly: newShopData.business_hours_weekly as unknown as Json,
          rating: newShopData.rating,
          phone_number: newShopData.phone_number,
          photo_url_api: newShopData.photo_url_api,
          api_last_updated: newShopData.api_last_updated,
          types: newShopData.types as unknown as Json, // Add types here for upsert
        },
        { onConflict: 'place_id' }
      );

    if (upsertError) {
      console.error('Error upserting shop data:', upsertError);
    }

    return NextResponse.json(newShopData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
