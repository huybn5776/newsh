export interface NewsItem {
  title: string;
  publication: string;
  timestamp: number;
  url: string;
  excerpt?: string;
  image?: string;
  relatedNewsItems?: NewsItem[];
}
