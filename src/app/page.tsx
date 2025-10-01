import ShopList from "@/features/shops/components/ShopList";
import { dummyShops } from "@/features/shops/data/shops";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ShopList shops={dummyShops} />
    </main>
  );
}