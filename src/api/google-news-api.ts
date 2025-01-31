import axios from 'axios';

import { NewsItem } from '@/interfaces/news-item';
import { NewsTopicItem } from '@/interfaces/news-topic-item';
import { RegionItem } from '@/interfaces/region-item';

enum NewsObjectType {
  MultiNewsGroup = 2,
  SingleNewsGroup = 3,
  MultiNews = 32,
  SingleNews = 13,
  CustomBanner = 14,
  MultiTopics = 24,
  SingleTopic = 11,
}

function requestBodyByTopic(topicId: string, languageAndRegion: string): [string, string][] {
  return [
    [
      'Ntv0se',
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"${languageAndRegion}",null,480],"${topicId}"]`,
    ],
    [
      'YOVgSd',
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"${languageAndRegion}",null,480],"${topicId}"]`,
    ],
  ];
}

function topicInfoBody(topicId: string, languageAndRegion: string): string[][] {
  return [
    [
      'YOVgSd',
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"${languageAndRegion}",null,480],"${topicId}"]`,
    ],
  ];
}

function sectionRequestBody(topicId: string, languageAndRegion: string): string[][] {
  return [
    [
      'gdtgie',
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"${languageAndRegion}"],"${topicId}"]`,
    ],
  ];
}

const multiTopicRequestCode = {
  topStories: 'A3Zed',
  worldAndNation: 'xBjcpf',
  others: 'N0vcJe',
};

type NewsObjectRaw = [number] & [unknown, NewsObjectRaw | NewsObjectRaw[] | string];

export async function getSingleTopicNews(topicId: string, languageAndRegion: string): Promise<NewsTopicItem> {
  const responseArray = await fetchNews(requestBodyByTopic(topicId, languageAndRegion));
  const newsTopicObject = JSON.parse(
    responseArray.find((array: string[]) => array[1] === 'Ntv0se')?.[2] ?? '[]',
  )[1][2] as NewsObjectRaw;
  const infoArray = JSON.parse(
    responseArray.find((array: string[]) => array[1] === 'YOVgSd')?.[2] ?? '[]',
  )[1][1] as NewsObjectRaw;

  const newsTopicItem = { ...parseNewsTopic(newsTopicObject), isPartial: false };
  newsTopicItem.name = infoArray?.[2] || newsTopicItem.name;
  return newsTopicItem;
}

export async function getSectionTopicNews(topicId: string, languageAndRegion: string): Promise<NewsTopicItem> {
  const requestBody = sectionRequestBody(topicId, languageAndRegion);
  const responseArray = await fetchNews(requestBody);
  const newsArray = JSON.parse(
    responseArray.find((array: string[]) => array[1] === 'gdtgie')?.[2] ?? '[]',
  )[1][2] as NewsObjectRaw;

  return {
    id: newsArray[1][1],
    name: newsArray[2],
    newsItems: (newsArray[3] as []).map((array) => parseNewsItem(array[3])),
    isPartial: false,
  };
}

export async function getTopicInfo(topicId: string, languageAndRegion: string): Promise<Partial<NewsTopicItem>> {
  const requestBody = topicInfoBody(topicId, languageAndRegion);
  const responseArray = await fetchNews(requestBody);
  const infoArray = JSON.parse(
    responseArray.find((array: string[]) => array[1] === 'YOVgSd')?.[2] ?? '[]',
  )[1][1] as NewsObjectRaw;
  const topicName: string | undefined = infoArray?.[2];
  return { name: topicName };
}

export async function getMultiTopicNews(
  topic: keyof typeof multiTopicRequestCode,
  languageAndRegion: string,
): Promise<NewsTopicItem[]> {
  const requestCode = multiTopicRequestCode[topic];
  const requestBody = [
    [
      requestCode,
      `["waareq",["zh-TW","TW",["SPORTS_FULL_COVERAGE","WEB_TEST_1_0_0"],null,[],1,1,"${languageAndRegion}",null,480]]`,
    ],
  ];
  const responseArray = await fetchNews(requestBody);
  const newsObjects = JSON.parse(responseArray[0][2])[1][2];
  const responseType = newsObjects[0];
  if (responseType !== NewsObjectType.MultiTopics) {
    throw new Error(`Incorrect response type, expect ${topic} to have multi topics response.`);
  }
  const newsTopicObjects = (newsObjects[3] as NewsObjectRaw[]).map(
    (newsObject: NewsObjectRaw) => newsObject[2],
  ) as NewsObjectRaw[];
  return newsTopicObjects.map((newsTopicObject) => ({ ...parseNewsTopic(newsTopicObject), isPartial: true }));
}

async function fetchNews(requestBody: unknown): Promise<NewsObjectRaw[]> {
  const response = await axios.post(
    '/news.google.com/_/DotsSplashUi/data/batchexecute',
    new URLSearchParams({
      'f.req': JSON.stringify([requestBody]),
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, responseType: 'text' },
  );
  return JSON.parse(response.data.split('\n')[2]);
}

function parseNewsTopic(newsTopicObject: NewsObjectRaw): Omit<NewsTopicItem, 'isPartial'> {
  const topicName = newsTopicObject[2];
  const topicId = `${newsTopicObject[13]?.[1] || newsTopicObject[21]}`.split('/')[1];

  const newsObjects: NewsObjectRaw[] = newsTopicObject[3];
  const newsItems: NewsItem[] = [];
  newsObjects.forEach((newsObject) => {
    const newsGroupType = newsObject[0];
    if (newsGroupType === NewsObjectType.CustomBanner) {
      return;
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
  });

  return { id: topicId, name: topicName, newsItems };
}

function parseNewsItem(newsNode: NewsObjectRaw): NewsItem {
  try {
    const url: string = newsNode[6];
    let image: string | undefined;
    if (url.includes('youtube')) {
      image = newsNode[15]?.[3]?.[0];
    } else {
      image = newsNode[8]?.[0]?.[0];
      image = image ? `/news.google.com/${image}=s0-w100-h100-p-rw-df` : undefined;
    }
    return {
      title: newsNode[2],
      excerpt: newsNode[3],
      publication: newsNode[10][2],
      publicationIcon: newsNode[10][3][0],
      timestamp: newsNode[4][0] * 1000,
      url,
      image,
    };
  } catch (error) {
    (error as Error & { newsNode: NewsObjectRaw }).newsNode = newsNode;
    throw error;
  }
}

export async function getRegionList(): Promise<RegionItem[]> {
  const response = await axios.post(
    '/news.google.com/_/DotsSplashUi/data/batchexecute',
    new URLSearchParams({
      'f.req': JSON.stringify([[['upfWee', '["waareq",["","",["",""],null,[],1,1,"US:en"]]']]]),
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, responseType: 'text' },
  );
  const responseArray = JSON.parse(response.data.split('\n')[2]);
  const responseData = JSON.parse(responseArray[0][2]);
  return responseData[1][2][3]
    .map((array: string[]) => array[11])
    .map((array: string[]) => ({
      languageAndRegion: array[0],
      label: array[1],
      country: array[2],
      language: array[3],
    }));
}
