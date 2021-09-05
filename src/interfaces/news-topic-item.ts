import { NewsTopicType } from '@enums/news-topic-type';

import { NewsItem } from './news-item';

export interface NewsTopicItem {
  name: string;
  type: NewsTopicType;
  newsItems: NewsItem[];
}
