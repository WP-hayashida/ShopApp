import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

let supabase: SupabaseClient | null = null;

const getSupabase = () => {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabase;
};

/**
 * Get user profile
 * @param userId The user ID
 * @returns Profile object or null
 */
export const getUserProfile = async (
  userId: string
): Promise<Profile | null> => {
  const supabaseClient = getSupabase();
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: 'No rows found'
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
};

/**
 * Upsert user profile. Creates a default profile if one doesn't exist.
 * @param user The Supabase user object
 * @returns Profile object or null
 */
export const upsertUserProfile = async (
  user: User
): Promise<Profile | null> => {
  const supabaseClient = getSupabase();
  let profile = await getUserProfile(user.id);

  if (!profile) {
    const { error: insertError } = await supabaseClient
      .from("profiles")
      .insert({
        id: user.id,
        username: user.user_metadata?.name || "Unnamed User",
        avatar_url: user.user_metadata?.avatar_url || null,
      });

    if (insertError) {
      console.error("Error creating default profile:", insertError);
      return null;
    }
    profile = {
      id: user.id,
      username: user.user_metadata?.name || "Unnamed User",
      avatar_url: user.user_metadata?.avatar_url || null,
    };
  }

  return profile;
};

/**
 * Update user profile
 * @param userId The user ID
 * @param updates The profile updates
 * @returns The updated profile or null
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> => {
  const supabaseClient = getSupabase();
  const { data, error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
};
