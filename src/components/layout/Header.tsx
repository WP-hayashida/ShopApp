'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []); // Wrap createClient in useMemo

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await supabase.auth.signOut();
      // Refresh the page to reflect the signed-out state
      window.location.reload();
    }
  };

  return (
    <header className="bg-gray-900 text-gray-100 shadow-md py-4 px-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-white">
        ShopShare
      </Link>
      <nav>
        <ul className="flex space-x-2 items-center">
          <li>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </li>
          <li>
            <Link href="/submit-shop">
              <Button variant="ghost">Add Shop</Button>
            </Link>
          </li>
          <li>
            <Link href="/my-page">
              <Button variant="ghost">My Page</Button>
            </Link>
          </li>
          <li>
            {!loading && user ? (
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                {user.user_metadata?.avatar_url && (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
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