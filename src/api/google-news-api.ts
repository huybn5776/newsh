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

const topicTypToTopicIdMap: Record<NewsTopicType, string> = {
  [NewsTopicType.Headline]: 'CAAqKggKIiRDQkFTRlFvSUwyMHZNRFZxYUdjU0JYcG9MVlJYR2dKVVZ5Z0FQAQ',
  [NewsTopicType.Nation]: 'CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFptTXpJU0JYcG9MVlJYS0FBUAE',
  [NewsTopicType.World]: 'CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx1YlY4U0JYcG9MVlJYR2dKVVZ5Z0FQAQ',
  [NewsTopicType.Business]: 'CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JYcG9MVlJYR2dKVVZ5Z0FQAQ',
  [NewsTopicType.TechnologyAndScience]: 'CAAqLAgKIiZDQkFTRmdvSkwyMHZNR1ptZHpWbUVnVjZhQzFVVnhvQ1ZGY29BQVAB',
  [NewsTopicType.Entertainment]: 'CAAqKggKIiRDQkFTRlFvSUwyMHZNREpxYW5RU0JYcG9MVlJYR2dKVVZ5Z0FQAQ',
  [NewsTopicType.Sports]: 'CAAqKggKIiRDQkFTRlFvSUwyMHZNRFp1ZEdvU0JYcG9MVlJYR2dKVVZ5Z0FQAQ',
  [NewsTopicType.Health]: 'CAAqJQgKIh9DQkFTRVFvSUwyMHZNR3QwTlRFU0JYcG9MVlJYS0FBUAE',
  [NewsTopicType.HeadlineDetail]:
    'CAAqKggKIiRDQkFTRlFvSUwyMHZNRFZxYUdjU0JYcG9MVlJYR2dKVVZ5Z0FQAQ/sections/CAQqLggAKioICiIkQ0JBU0ZRb0lMMjB2TURWcWFHY1NCWHBvTFZSWEdnSlVWeWdBUAE',
};
const topicIdToTopicTypeMap = Object.fromEntries(
  Object.entries(topicTypToTopicIdMap).map(([id, type]) => [type, id]),
) as Record<string, NewsTopicType>;

function requestBodyByTopic(topicId: string): [string, string][] {
  return [
    [
      'Ntv0se',
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480],"${topicId}"]`,
    ],
    [
      'YOVgSd',
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480],"${topicId}"]`,
    ],
  ];
}

const requestBodies = {
  topStories: [
    ['A3Zed', '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480]]'],
  ],
  worldAndNation: [
    ['xBjcpf', '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480]]'],
  ],
  others: [
    ['N0vcJe', '["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"TW:zh-Hant",null,480]]'],
  ],
};
export const requestTopics = Object.keys(requestBodies) as (keyof typeof requestBodies)[];

type NewsObjectRaw = [number] & [unknown, NewsObjectRaw | NewsObjectRaw[] | string];
type ValueOf<T> = T[keyof T];

export async function getSingleTopicNews(topicType: NewsTopicType): Promise<NewsTopicItem> {
  const responseArray = await fetchNews(requestBodyByTopic(topicTypToTopicIdMap[topicType]));
  const newsArray = JSON.parse(
    responseArray.find((array: string[]) => array[1] === 'Ntv0se')?.[2] || '[]',
  )[1][2] as NewsObjectRaw;
  const infoArray = JSON.parse(
    responseArray.find((array: string[]) => array[1] === 'YOVgSd')?.[2] || '[]',
  )[1][1] as NewsObjectRaw;

  const responseType = newsArray[0];
  if (responseType !== NewsObjectType.SingleTopic) {
    throw new Error(`Incorrect response type, expect ${topicType} to have single topics response.`);
  }
  const newsTopicObject = newsArray as NewsObjectRaw;
  const newsTopicItem = parseNewsTopic(newsTopicObject);
  newsTopicItem.name = infoArray?.[2] || newsTopicItem.name;
  return newsTopicItem;
}

export async function getMultiTopicNews(topic: keyof typeof requestBodies): Promise<NewsTopicItem[]> {
  const responseArray = await fetchNews(requestBodies[topic]);
  const newsObjects = JSON.parse(responseArray[0][2])[1][2];
  const responseType = newsObjects[0];
  if (responseType !== NewsObjectType.MultiTopics) {
    throw new Error(`Incorrect response type, expect ${topic} to have multi topics response.`);
  }
  const newsTopicObjects = (newsObjects[3] as NewsObjectRaw[]).map(
    (newsObject: NewsObjectRaw) => newsObject[2],
  ) as NewsObjectRaw[];
  return newsTopicObjects.map(parseNewsTopic);
}

async function fetchNews(requestBody: ValueOf<typeof requestBodies>): Promise<NewsObjectRaw[]> {
  const response = await axios.post(
    '/news.google.com/_/DotsSplashUi/data/batchexecute',
    new URLSearchParams({
      'f.req': JSON.stringify([requestBody]),
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, responseType: 'text' },
  );
  return JSON.parse(response.data.split('\n')[2]);
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
  const topicId = `${newsTopicObject[13]?.[1] || newsTopicObject[21]}`.split('/')[1];
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
      publication: newsNode[10][2],
      timestamp: newsNode[4][0] * 1000,
      url,
      image,
    };
  } catch (error) {
    (error as Error & { newsNode: NewsObjectRaw }).newsNode = newsNode;
    throw error;
  }
}
