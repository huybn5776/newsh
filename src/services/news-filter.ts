import { NewsTopicType } from '@enums/news-topic-type';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';

export function collapseRelatedNewsExcept(
  topicsToShow: NewsTopicType[],
): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return (newsTopicItem: NewsTopicItem) => {
    const toCollapse = topicsToShow.length && !topicsToShow.includes(newsTopicItem.type);
    return { ...newsTopicItem, newsItems: toCollapse ? [] : newsTopicItem.newsItems };
  };
}

export function removeYoutubeNews(): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return (newsTopicItem: NewsTopicItem) => {
    const newsItems: NewsItem[] = newsTopicItem.newsItems;
    const filterNewsItems: NewsItem[] = [];
    newsItems.forEach((newsItem) => {
      const filteredRelatedNewsItems = (newsItem.relatedNewsItems || []).filter(
        (relatedNews) => !relatedNews.url.includes('youtube'),
      );
      if (newsItem.url.includes('youtube') && !filteredRelatedNewsItems.length) {
        return;
      }

      let filteredNewsItem: NewsItem;
      if (newsItem.url.includes('youtube')) {
        filteredNewsItem = { ...filteredRelatedNewsItems[0], relatedNewsItems: filteredRelatedNewsItems.slice(1) };
      } else {
        filteredNewsItem = { ...newsItem, relatedNewsItems: filteredRelatedNewsItems };
      }
      filterNewsItems.push(filteredNewsItem);
    });

    return { ...newsTopicItem, newsItems: filterNewsItems };
  };
}
