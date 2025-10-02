"use client";

import ShopList from "@/app/(features)/_components/ShopList";
import { dummyShops } from "@/app/(features)/_lib/data";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <ShopList shops={dummyShops} />
    </main>
  );
}
