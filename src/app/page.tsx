import ShopList from "@/features/shops/components/ShopList";
import { dummyShops } from "@/features/shops/data/shops";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-100 d-flex justify-content-end mb-4">
        <Link href="/shops/new" className="btn btn-primary">
          新しいお店を投稿する
        </Link>
      </div>
      <ShopList shops={dummyShops} />
    </main>
  );
}