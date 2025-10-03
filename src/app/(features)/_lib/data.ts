import { Shop } from "./types";

export const dummyShops: Shop[] = [
  {
    id: "1",
    name: "おしゃれカフェ東京",
    photo_url:
      "https://via.placeholder.com/300x200/FFC0CB/000000?text=Cafe+Image",
    url: "https://example.com/cafe-tokyo",
    business_hours: "10:00 - 20:00",
    location: "東京都",
    category: "カフェ",
    detailed_category: "スペシャルティコーヒー",
    comments:
      "落ち着いた雰囲気の隠れ家カフェ。こだわりのコーヒーと手作りケーキが楽しめます。",
  },
  {
    id: "2",
    name: "大阪の絶品ラーメン",
    photo_url:
      "https://via.placeholder.com/300x200/ADD8E6/000000?text=Ramen+Image",
    url: "https://example.com/ramen-osaka",
    business_hours: "11:00 - 22:00",
    location: "大阪府",
    category: "ラーメン",
    detailed_category: "豚骨醤油",
    comments: "濃厚な豚骨スープと自家製麺が自慢。行列の絶えない人気店です。",
  },
];
