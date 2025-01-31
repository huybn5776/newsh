import { NewsIndex } from '@/interfaces/news-index';
import { NewsItem } from '@/interfaces/news-item';
import { NewsTopicItem } from '@/interfaces/news-topic-item';
import { SeenNewsItem } from '@/interfaces/seen-news-item';
import { trimNewsTitle } from '@/services/news-service';

export function removeYoutubeNews(): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => news.url.includes('youtube'));
}

export function removeByTitleLength(titleLength: number): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => news.title.length < titleLength);
}

export function removeByNewsSource(sources: string[]): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => sources.includes(news.publication));
}

export function removeByNewsUrlMatch(urlMatches: string[]): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => urlMatches.some((match) => !!news.url.match(match)));
}

export function removeByTerms(terms: string[]): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  return removeNewsOfTopicBy((news) => terms.some((term) => news.title.includes(term)));
}

export function createNewsIndex(newsItems: NewsItem[] | SeenNewsItem[]): NewsIndex {
  const titles = new Set(newsItems.map((news) => trimNewsTitle(news.title)));
  const urls = new Set(newsItems.map((news) => news.url));
  return { titles, urls };
}

export function isNewsItemExists(newsIndex: NewsIndex, newsItem: NewsItem | SeenNewsItem): boolean {
  return newsIndex.urls.has(newsItem.url) || newsIndex.titles.has(trimNewsTitle(newsItem.title));
}

export function removeDuplicatedNewsItemOfTopics(
  existingTopics: NewsTopicItem[],
  newsTopicItems: NewsTopicItem[],
): NewsTopicItem[] {
  const allNewsItems = getAllNewsItemFromTopics(existingTopics);
  const newsIndex = createNewsIndex(allNewsItems);

  return newsTopicItems.map((newsTopicItem, index) => {
    const newsRemover = removeNewsItemBy((news) => isNewsItemExists(newsIndex, news));
    const newsItems = newsTopicItem.newsItems.flatMap((newsItem) => newsRemover(newsItem) ?? []);
    const allNewsItemsOfTopic = getAllNewsItemFromTopics([newsTopicItem]);
    const hasNext = index !== newsTopicItems.length - 1;
    if (hasNext) {
      allNewsItemsOfTopic.forEach((newsItem) => {
        newsIndex.urls.add(newsItem.url);
        newsIndex.titles.add(trimNewsTitle(newsItem.title));
      });
    }
    return { ...newsTopicItem, newsItems };
  });
}

function removeNewsOfTopicBy(
  predicate: (newsItem: NewsItem) => boolean,
): (newsTopicItem: NewsTopicItem) => NewsTopicItem {
  const filter = removeNewsItemBy(predicate);

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

function getAllNewsItemFromTopics(newsTopicItems: NewsTopicItem[]): NewsItem[] {
  return newsTopicItems.flatMap((topic) => [
    ...topic.newsItems,
    ...topic.newsItems.flatMap((news) => news.relatedNewsItems ?? []),
  ]);
}

function removeNewsItemBy(isToRemove: (newsItem: NewsItem) => boolean): (newsItem: NewsItem) => NewsItem | null {
  return (newsItem: NewsItem) => {
    const updatedNewsItem = { ...newsItem };

    if (updatedNewsItem.relatedNewsItems?.length) {
      updatedNewsItem.relatedNewsItems = updatedNewsItem.relatedNewsItems.filter((news) => !isToRemove(news));
    }

    if (isToRemove(updatedNewsItem)) {
      if (updatedNewsItem.relatedNewsItems?.length) {
        const [firstRelatedNews, ...relatedNewsItems] = updatedNewsItem.relatedNewsItems;
        return { ...firstRelatedNews, relatedNewsItems };
      }
      return null;
    }

    return updatedNewsItem;
  };
}
