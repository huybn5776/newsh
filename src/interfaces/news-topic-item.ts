import { NewsItem } from './news-item';

export interface NewsTopicItem {
  id: string;
  name: string;
  newsItems: NewsItem[];
  isPartial: boolean;
}
