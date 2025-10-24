"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string[];
  setCategoryFilter: React.Dispatch<React.SetStateAction<string[]>>; // Corrected type
  shopListRefreshKey: number;
  triggerShopListRefresh: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [shopListRefreshKey, setShopListRefreshKey] = useState(0);

  const triggerShopListRefresh = useCallback(() => {
    setShopListRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        categoryFilter,
        setCategoryFilter,
        shopListRefreshKey,
        triggerShopListRefresh,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
