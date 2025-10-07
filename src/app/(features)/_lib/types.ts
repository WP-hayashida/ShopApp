export interface Shop {
  id: string;
  name: string;
  photo_url: string;
  url: string;
  business_hours: string;
  location: string;
  category: string;
  detailed_category: string;
  comments: string;
  like_count?: number;
}
