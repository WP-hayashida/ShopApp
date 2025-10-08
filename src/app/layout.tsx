'use client'; // Add use client directive

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { SearchProvider } from "@/context/SearchContext"; // Import SearchProvider

// フォントの設定
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * ルートレイアウトコンポーネント
 * すべてのページに適用される基本的なHTML構造を定義します。
 * @param children - 子要素
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SearchProvider>
          <Header />
          <main>{children}</main>
        </SearchProvider>
      </body>
    </html>
  );
}
