'use client';

<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect, useMemo } from 'react';
>>>>>>> feature/like-functionality
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const supabase = createClient();

=======
  const supabase = useMemo(() => createClient(), []); // Wrap createClient in useMemo
>>>>>>> feature/like-functionality
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
<<<<<<< HEAD
  }, [supabase.auth]);
=======
  }, []);
>>>>>>> feature/like-functionality

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    if (window.confirm('サインアウトしますか？')) {
      await supabase.auth.signOut();
<<<<<<< HEAD
      // Refresh the page to reflect the signed-out state
=======
>>>>>>> feature/like-functionality
      window.location.reload();
    }
  };

  return (
    <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-gray-800">
        ShopShare
      </Link>
      <nav>
        <ul className="flex space-x-4 items-center">
          <li>
            <Link href="/submit-shop">
              <Button variant="outline" className="text-gray-800">Add Shop</Button>
            </Link>
          </li>
          <li>
            <Link href="/my-page">
              <Button variant="outline" className="text-gray-800">マイページ</Button>
            </Link>
          </li>
          <li>
            {!loading && user ? (
              <Button onClick={handleSignOut} variant="ghost" className="flex items-center space-x-2">
                {user.user_metadata?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{user.user_metadata?.name || user.email}</span>
              </Button>
            ) : (
              <Button onClick={handleSignIn}>Sign In with Google</Button>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;