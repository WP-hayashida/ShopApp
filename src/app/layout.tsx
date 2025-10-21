"use client"; // Add use client directive

import { APIProvider } from "@vis.gl/react-google-maps";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shared/Header";
import { SearchProvider } from "@/context/SearchContext"; // Import SearchProvider
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

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
        <APIProvider
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
          libraries={["places", "geocoding", "routes"]}
        >
          <SearchProvider>
            <Header />
            <main>{children}</main>
            <Toaster /> {/* Render Toaster here */}
          </SearchProvider>
        </APIProvider>
      </body>
    </html>
  );
}
