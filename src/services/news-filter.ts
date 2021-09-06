import { NewsTopicType } from '@enums/news-topic-type';
import { NewsTopicItem } from '@interfaces/news-topic-item';

export function collapseRelatedNewsExcept(
  topicsToShow: NewsTopicType[],
): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return (newsTopicItem: NewsTopicItem) => {
    const toCollapse = topicsToShow.length && !topicsToShow.includes(newsTopicItem.type);
    return { ...newsTopicItem, newsItems: toCollapse ? [] : newsTopicItem.newsItems };
  };
}
