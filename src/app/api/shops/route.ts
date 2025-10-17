import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ShopPayload } from '@/app/(features)/_lib/types';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.json();

  // --- Geocoding and Place Details Logic ---
  let latitude: number | null = null;
  let longitude: number | null = null;
  let place_id: string | null = null;
  let formatted_address: string | null = null;
  let business_hours_weekly: any = null; // Adjust type as needed
  let phone_number: string | null = null;
  let photo_url_api: string | null = null;
  let api_last_updated: string | null = null;
  let nearest_station_name: string | null = null;
  let nearest_station_place_id: string | null = null;
  let walk_time_from_station: number | null = null;

  if (formData.location) {
    console.log('Attempting to geocode location:', formData.location);
    try {
      // Call Geocoding API
      const geocodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/geocode`;
      console.log('Calling geocode API:', geocodeUrl);
      const geocodeRes = await fetch(geocodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: formData.location }),
      });
      const geocodeData = await geocodeRes.json();
      console.log('Geocode API response:', geocodeData);

      if (geocodeData.lat && geocodeData.lng) {
        latitude = geocodeData.lat;
        longitude = geocodeData.lng;
        place_id = geocodeData.place_id || null;
        formatted_address = geocodeData.formatted_address || null;
        console.log('Geocoding successful:', { latitude, longitude, place_id, formatted_address });
      } else {
        console.log('Geocoding did not return lat/lng for:', formData.location);
      }

      // If place_id is available, call Place Details API
      if (place_id) {
        console.log('Attempting to get place details for place_id:', place_id);
        const placeDetailsUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/placedetails`;
        console.log('Calling place details API:', placeDetailsUrl);
        const placeDetailsRes = await fetch(placeDetailsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ place_id: place_id }),
        });
        const placeDetailsData = await placeDetailsRes.json();
        console.log('Place Details API response:', placeDetailsData);

        if (placeDetailsData.result) {
          business_hours_weekly = placeDetailsData.result.opening_hours?.weekday_text || null;
          phone_number = placeDetailsData.result.international_phone_number || null;
          photo_url_api = placeDetailsData.result.photos?.[0]?.photo_reference || null;
          api_last_updated = new Date().toISOString();
          console.log('Place details successful:', { business_hours_weekly, phone_number, photo_url_api, api_last_updated });
        } else {
          console.log('Place details did not return result for place_id:', place_id);
        }
      } else {
        console.log('No place_id available for place details lookup.');
      }
    } catch (error) {
      console.error('Error during geocoding or place details:', error);
      // Decide how to handle this error: proceed without geo data, or return an error
    }
  }

  // --- Image Upload Logic (if selectedImage is a file) ---
  let photo_url: string | null = null;
  if (formData.selectedImage) {
    // Assuming formData.selectedImage is a base64 string or similar for now
    // In a real app, you'd handle file uploads to Supabase Storage here
    // For simplicity, let's assume it's a URL or we'll handle it later.
    // For now, we'll just use the photo_url_api if available, or a placeholder.
    photo_url = photo_url_api || "/next.svg"; // Placeholder
  }


  const shopPayload: ShopPayload = {
    name: formData.name,
    photo_url: photo_url, // This will be the uploaded image URL or placeholder
    url: formData.url,
    business_hours_weekly: business_hours_weekly,
    rating: null, // To be set by reviews
    location: formData.location, // Original text location
    category: formData.categories,
    detailed_category: formData.detailed_category || formData.categories.join(','), // Use detailed_category from form or categories
    comments: formData.description,
    user_id: user.id, // Now required
    latitude: latitude,
    longitude: longitude,
    place_id: place_id,
    formatted_address: formatted_address,
    nearest_station_name: nearest_station_name,
    nearest_station_place_id: nearest_station_place_id,
    walk_time_from_station: walk_time_from_station,
    phone_number: phone_number,
    photo_url_api: photo_url_api,
    api_last_updated: api_last_updated,
    price_range: null, // Not in form yet
  };

  const { data, error } = await supabase.from('shops').insert([shopPayload]).select();

  if (error) {
    console.error('Error inserting shop:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Shop submitted successfully', shop: data[0] }, { status: 201 });
}