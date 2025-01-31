export interface NewsItem {
  title: string;
  publication: string;
  publicationIcon: string;
  timestamp: number;
  url: string;
  excerpt?: string;
  image?: string;
  relatedNewsItems?: NewsItem[];
}
