import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';

export function collapseRelatedNewsExcept(topicsToShow: string[]): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return (newsTopicItem: NewsTopicItem) => {
    const toCollapse = topicsToShow.length && !topicsToShow.includes(newsTopicItem.id);
    return { ...newsTopicItem, newsItems: toCollapse ? [] : newsTopicItem.newsItems };
  };
}

export function removeYoutubeNews(): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => news.url.includes('youtube'));
}

export function removeByNewsSource(publications: string[]): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => publications.includes(news.publication));
}

export function removeByTerms(terms: string[]): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => terms.some((term) => news.title.includes(term)));
}

function removeNewsOfTopicBy(
  predicate: (newsItem: NewsItem) => boolean,
): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  const filter = removeNewsBy(predicate);

  return (newsTopicItem: NewsTopicItem) => {
    const { newsItems } = newsTopicItem;
    const filteredNewsItems: NewsItem[] = [];
    newsItems.forEach((newsItem) => {
      const updatedNewsItem = filter(newsItem);
      if (updatedNewsItem) {
        filteredNewsItems.push(updatedNewsItem);
      }
    });

    return { ...newsTopicItem, newsItems: filteredNewsItems };
  };
}

function removeNewsBy(predicate: (newsItem: NewsItem) => boolean): (newsItem: NewsItem) => NewsItem | null {
  return (newsItem: NewsItem) => {
    const updatedNewsItem = { ...newsItem };

    if (updatedNewsItem.relatedNewsItems?.length) {
      updatedNewsItem.relatedNewsItems = updatedNewsItem.relatedNewsItems.filter((news) => !predicate(news));
    }

    if (predicate(updatedNewsItem)) {
      if (updatedNewsItem.relatedNewsItems?.length) {
        const [replacedNewsItem, ...relatedNewsItems] = updatedNewsItem.relatedNewsItems;
        replacedNewsItem.relatedNewsItems = relatedNewsItems;
        return replacedNewsItem;
      }
      return null;
    }

    return updatedNewsItem;
  };
}
