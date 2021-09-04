export interface NewsItem {
  title: string;
  url: string;
  excerpt?: string;
  image?: string;
  relatedNewsItems?: NewsItem[];
}
