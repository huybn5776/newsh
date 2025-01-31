import { NewsTopicType } from '@/enums/news-topic-type';

export interface NewsTopicInfo {
  id: string;
  name: string;
  sectionName?: string;
  type: NewsTopicType;
  isCustomTopic?: boolean;
}
