import axios from 'axios';

import { NewsTopicType } from '@enums/news-topic-type';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';

enum NewsObjectType {
  MultiNewsGroup = 2,
  SingleNewsGroup = 3,
  MultiNews = 32,
  SingleNews = 13,
  CustomBanner = 14,
  MultiTopics = 24,
  SingleTopic = 11,
}

const requestBodies = {
  topStories: [
    [
      [
        'A3Zed',
        '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480]]',
      ],
    ],
  ],
  worldAndNation: [
    [
      [
        'xBjcpf',
        '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480]]',
      ],
    ],
  ],
  others: [
    [
      [
        'N0vcJe',
        '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480]]',
      ],
    ],
  ],
  headline: [
    [
      [
        'Ntv0se',
        '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480],"CAAqKggKIiRDQkFTRlFvSUwyMHZNRFZxYUdjU0JYcG9MVlJYR2dKVVZ5Z0FQAQ"]',
      ],
    ],
  ],
};
export const requestTopics = Object.keys(requestBodies) as (keyof typeof requestBodies)[];

type NewsObjectRaw = [number] & [unknown, NewsObjectRaw | NewsObjectRaw[] | string];
type ValueOf<T> = T[keyof T];

export async function getNews(topic: keyof typeof requestBodies): Promise<NewsTopicItem[]> {
  const responseArray = await fetchNews(requestBodies[topic]);
  const newsTopicObjects = extractNewsTopicObjects(responseArray);
  return newsTopicObjects.map(parseNewsTopic);
}

async function fetchNews(requestBody: ValueOf<typeof requestBodies>): Promise<NewsObjectRaw> {
  const response = await axios.post(
    '/news.google.com/_/DotsSplashUi/data/batchexecute',
    new URLSearchParams({
      'f.req': JSON.stringify(requestBody),
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, responseType: 'text' },
  );
  let responseArray = JSON.parse(response.data.split('\n')[2]);
  responseArray = JSON.parse(responseArray[0][2])[1][2];
  return responseArray;
}

function extractNewsTopicObjects(responseArray: NewsObjectRaw): NewsObjectRaw[] {
  const responseType = responseArray[0];
  if (responseType === NewsObjectType.MultiTopics) {
    return (responseArray[3] as NewsObjectRaw[]).map((newsObject: NewsObjectRaw) => newsObject[2]);
  } else if (responseType === NewsObjectType.SingleTopic) {
    return [responseArray as NewsObjectRaw];
  }
  return [];
}

function parseNewsTopic(newsTopicObject: NewsObjectRaw): NewsTopicItem {
  const topicName = newsTopicObject[2];
  const topicType = parseTopicType(newsTopicObject);

  const newsObjects: NewsObjectRaw[] = newsTopicObject[3];
  const newsItems: NewsItem[] = [];
  for (const newsObject of newsObjects) {
    const newsGroupType = newsObject[0];
    if (newsGroupType === NewsObjectType.CustomBanner) {
      continue;
    }

    let newsItem: NewsItem;
    if (newsGroupType === NewsObjectType.MultiNewsGroup) {
      const subNewsObjects: NewsObjectRaw[] = newsObject[2][3];
      const headSubNews = subNewsObjects[0];
      newsItem = parseNewsItem(headSubNews[3]);
      newsItem.relatedNewsItems = subNewsObjects
        .splice(1, subNewsObjects.length)
        .map((subNewsObject) => parseNewsItem(subNewsObject[3]));
    } else {
      newsItem = parseNewsItem(newsObject[3]);
    }
    newsItems.push(newsItem);
  }

  return { name: topicName, type: topicType, newsItems };
}

function parseTopicType(newsTopicObject: NewsObjectRaw): NewsTopicType {
  const topicIdToTopicTypeMap: Record<string, NewsTopicType> = {
    CAAqKggKIiRDQkFTRlFvSUwyMHZNRFZxYUdjU0JYcG9MVlJYR2dKVVZ5Z0FQAQ: NewsTopicType.Headline,
    CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFptTXpJU0JYcG9MVlJYS0FBUAE: NewsTopicType.Nation,
    CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx1YlY4U0JYcG9MVlJYR2dKVVZ5Z0FQAQ: NewsTopicType.World,
    CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JYcG9MVlJYR2dKVVZ5Z0FQAQ: NewsTopicType.Business,
    CAAqLAgKIiZDQkFTRmdvSkwyMHZNR1ptZHpWbUVnVjZhQzFVVnhvQ1ZGY29BQVAB: NewsTopicType.TechnologyAndScience,
    CAAqKggKIiRDQkFTRlFvSUwyMHZNREpxYW5RU0JYcG9MVlJYR2dKVVZ5Z0FQAQ: NewsTopicType.Entertainment,
    CAAqKggKIiRDQkFTRlFvSUwyMHZNRFp1ZEdvU0JYcG9MVlJYR2dKVVZ5Z0FQAQ: NewsTopicType.Sports,
    CAAqJQgKIh9DQkFTRVFvSUwyMHZNR3QwTlRFU0JYcG9MVlJYS0FBUAE: NewsTopicType.Health,
    'CAAqKggKIiRDQkFTRlFvSUwyMHZNRFZxYUdjU0JYcG9MVlJYR2dKVVZ5Z0FQAQ/sections/CAQqLggAKioICiIkQ0JBU0ZRb0lMMjB2TURWcWFHY1NCWHBvTFZSWEdnSlVWeWdBUAE':
      NewsTopicType.HeadlineDetail,
  };
  const topicId = `${newsTopicObject[13]?.[1] || newsTopicObject[21]}`.split('topics/')[1];
  return topicIdToTopicTypeMap[topicId];
}

function parseNewsItem(newsNode: NewsObjectRaw): NewsItem {
  try {
    const url: string = newsNode[6];
    let image: string | undefined;
    if (url.includes('youtube')) {
      image = newsNode[15]?.[3]?.[0];
    } else {
      image = newsNode[8]?.[0]?.[0];
      image = image ? `${image}=s0-w100-h100-p-rw-df` : undefined;
    }
    return {
      title: newsNode[2],
      excerpt: newsNode[3],
      url,
      image,
    };
  } catch (error) {
    (error as Error & { newsNode: NewsObjectRaw }).newsNode = newsNode;
    throw error;
  }
}
