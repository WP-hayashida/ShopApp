CREATE OR REPLACE FUNCTION public.search_shops(
    p_keyword_general text,
    p_keyword_location text,
    p_category_filter text[],
    p_search_lat double precision,
    p_search_lng double precision,
    p_search_radius double precision,
    p_sort_by text,
    p_current_user_id uuid,
    p_posted_by_user_id uuid,
    p_liked_by_user_id uuid,
    p_shop_id uuid -- Add shop ID parameter
)
RETURNS TABLE(
    id uuid,
    name text,
    photo_url text,
    url text,
    business_hours text,
    location text,
    latitude double precision,
    longitude double precision,
    category text[],
    detailed_category text,
    comments text,
    searchable_categories_text text,
    tags text[],
    nearest_station_name text,
    walk_time_from_station integer,
    created_at timestamp with time zone,
    user_id uuid,
    username text,
    avatar_url text,
    like_count bigint,
    liked boolean,
    rating double precision,
    review_count bigint,
    business_hours_weekly jsonb,
    price_range text,
    phone_number text,
    photo_url_api text,
    api_last_updated timestamp with time zone,
    place_id text,
    formatted_address text,
    nearest_station_place_id text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id::uuid,
        s.name::text,
        s.photo_url::text,
        s.url::text,
        s.business_hours::text,
        s.location::text,
        s.latitude::double precision,
        s.longitude::double precision,
        s.category::text[],
        s.detailed_category::text,
        s.comments::text,
        s.searchable_categories_text::text,
        ARRAY(SELECT TRIM(UNNEST(string_to_array(s.detailed_category, ','))))::text[] AS tags,
        s.nearest_station_name::text,
        s.walk_time_from_station::integer,
        s.created_at::timestamp with time zone,
        s.user_id::uuid,
        p.username::text,
        p.avatar_url::text,
        COALESCE(l.like_count, 0)::bigint as like_count,
        CASE WHEN p_current_user_id IS NOT NULL THEN EXISTS (
            SELECT 1 FROM likes WHERE likes.shop_id = s.id AND likes.user_id = p_current_user_id
        ) ELSE FALSE END::boolean as liked,
        s.rating::double precision,
        COALESCE(review_counts.count, 0)::bigint AS review_count,
        s.business_hours_weekly::jsonb,
        s.price_range::text,
        s.phone_number::text,
        s.photo_url_api::text,
        s.api_last_updated::timestamp with time zone,
        s.place_id::text,
        s.formatted_address::text,
        s.nearest_station_place_id::text
    FROM public.shops s
    LEFT JOIN public.profiles p ON s.user_id = p.id
    LEFT JOIN (SELECT shop_id, count(*) as like_count FROM public.likes GROUP BY shop_id) l ON s.id = l.shop_id
    LEFT JOIN (SELECT shop_id, COUNT(*) as count FROM reviews GROUP BY shop_id) AS review_counts ON s.id = review_counts.shop_id
    LEFT JOIN public.likes liked_filter_join ON p_liked_by_user_id IS NOT NULL AND s.id = liked_filter_join.shop_id
    WHERE
        (p_shop_id IS NULL OR s.id = p_shop_id) -- Filter by shop ID
    AND
        (
            p_keyword_general IS NULL OR p_keyword_general = '' OR
            (
                s.name || ' ' ||
                COALESCE(s.location, '') || ' ' ||
                COALESCE(s.formatted_address, '') || ' ' ||
                COALESCE(s.comments, '') || ' ' ||
                COALESCE(s.detailed_category, '') || ' ' ||
                COALESCE(array_to_string(s.category, ' '), '') || ' ' ||
                COALESCE(s.searchable_categories_text, '') || ' ' ||
                COALESCE(s.nearest_station_name, '')
            ) % p_keyword_general
        )
    AND
        (p_category_filter IS NULL OR p_category_filter = '{}' OR s.category && p_category_filter)
    AND
        (p_search_lat IS NULL OR p_search_lng IS NULL OR p_search_radius IS NULL OR ST_DWithin(ST_MakePoint(s.longitude, s.latitude)::geography, ST_MakePoint(p_search_lng, p_search_lat)::geography, p_search_radius))
    AND
        (p_posted_by_user_id IS NULL OR s.user_id = p_posted_by_user_id)
    AND
        (p_liked_by_user_id IS NULL OR liked_filter_join.user_id = p_liked_by_user_id)
    ORDER BY
        CASE WHEN p_sort_by = 'likes.desc' THEN COALESCE(l.like_count, 0) END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'rating.desc' THEN s.rating END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'created_at.desc' THEN s.created_at END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'created_at.asc' THEN s.created_at END ASC NULLS LAST,
        s.created_at DESC;
END;
$$;