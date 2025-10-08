import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react"; // Added useRef
import { Search, LogOut, Plus, UserRoundPlus } from "lucide-react";
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

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage }: HeaderProps) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { searchTerm, setSearchTerm } = useSearch(); // Use searchTerm from context
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

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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
              <h1 className="text-xl font-semibold tracking-tight">
                SpotShare
              </h1>
              <p className="text-xs text-muted-foreground">Curated Places</p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="お店を検索..."
                className="pl-10 bg-muted/50 border-border/60 focus:border-foreground/20 transition-colors"
                value={localSearchTerm} // Use localSearchTerm for input value
                onChange={handleKeywordChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link href="/submit-shop">
              <Button
                variant="default"
                className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="size-4" />
                <span>投稿</span>
              </Button>
            </Link>

            {!loading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.user_metadata?.avatar_url || ""}
                        alt="User Avatar"
                      />
                      <AvatarFallback>
                        {user?.user_metadata?.name?.[0] ||
                          user?.email?.[0] ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  {user ? (
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
                        <Link href="/my-page">My Page</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={handleSignIn}>
                      <UserRoundPlus className="mr-2 h-4 w-4" />
                      Sign In
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="お店を検索..."
              className="pl-10 bg-muted/50 border-border/60"
              value={localSearchTerm} // Use localSearchTerm for input value
              onChange={handleKeywordChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
