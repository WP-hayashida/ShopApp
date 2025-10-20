import React, { useState, useEffect, useMemo, useRef } from "react"; // Added useRef
import { Search, LogOut, Plus, UserRoundPlus, Menu, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useSearch } from "@/context/SearchContext"; // Import useSearch hook
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setSearchTerm } = useSearch(); // Use searchTerm from context
  const [localSearchTerm, setLocalSearchTerm] = useState(""); // Local state for input value
  const [isComposing, setIsComposing] = useState(false); // State to track IME composition
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce ref

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKeyword = e.target.value;
    setLocalSearchTerm(newKeyword); // Always update local state for immediate feedback

    if (!isComposing) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        setSearchTerm(newKeyword); // Update context after debounce
      }, 700); // Debounce for 700ms
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setIsComposing(false);
    // After composition ends, immediately trigger search with the final value
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    const finalKeyword = e.currentTarget.value;
    setSearchTerm(finalKeyword);
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      setUser(supabaseUser);
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
      if (debounceTimeoutRef.current) {
        // Clear debounce on unmount
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [supabase, debounceTimeoutRef]); // Add debounceTimeoutRef to dependencies

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    if (window.confirm("本当にサインアウトしますか？")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="size-10 rounded-lg bg-foreground text-background flex items-center justify-center transition-all group-hover:shadow-lg">
              <span className="text-lg font-bold">SS</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight hidden md:block">
                SpotShare
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                Curated Places
              </p>
            </div>
          </Link>

          {/* Search Popover Trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto mr-2 md:mr-0"
              >
                <Search className="size-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="left"
              sideOffset={10}
              className="w-fit p-0 border-none shadow-none bg-transparent"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="お店を検索..."
                  className="pl-10 bg-white/90 border-border/60 focus:border-foreground/20 transition-colors"
                  value={localSearchTerm}
                  onChange={handleKeywordChange}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Actions for Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/submit-shop">
              <Button
                variant="default"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="size-4" />
                <span>投稿</span>
              </Button>
            </Link>

            {!loading &&
              (user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || ""}
                          alt="User Avatar"
                        />
                        <AvatarFallback>
                          {user.user_metadata?.name?.[0] ||
                            user.email?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-page">My Page</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleSignIn} variant="outline">
                  <UserRoundPlus className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              ))}
          </div>

          {/* Hamburger Menu for Mobile */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {!loading &&
                  (user ? (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.user_metadata?.name || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/submit-shop">
                          <Plus className="mr-2 h-4 w-4" />
                          投稿
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/">
                          {/* Added this item */}
                          <Store className="mr-2 h-4 w-4" />
                          {/* Using Store icon for list */}
                          お店一覧
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-page">
                          <UserRoundPlus className="mr-2 h-4 w-4" />
                          My Page
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {/* Added fragment for multiple items */}
                      <DropdownMenuItem asChild>
                        <Link href="/">
                          {/* Added this item for logged out users */}
                          <Store className="mr-2 h-4 w-4" />
                          お店一覧
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignIn}>
                        <UserRoundPlus className="mr-2 h-4 w-4" />
                        Sign In
                      </DropdownMenuItem>
                    </>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
