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

export enum NewsRequestTypes {
  TopStories = 'topStories',
  Recommended = 'recommended',
  AllTopics = 'allTopics',
}

const topicRequestCode: Record<NewsRequestTypes, NewsRequestContent> = {
  [NewsRequestTypes.TopStories]: { id: 'Giukpf', contentType: 'gbreq' },
  [NewsRequestTypes.Recommended]: { id: 'HOnZud', contentType: 'ghfypsreq' },
  [NewsRequestTypes.AllTopics]: { id: 'i6owq', contentType: 'ghncsreq' },
};

interface NewsRequestContent {
  id: string;
  contentType: string;
}

type NewsObjectRaw = [number] & [unknown, NewsObjectRaw | NewsObjectRaw[] | string];

function createRequestBody(request: NewsRequestContent, languageAndRegion: string): [string, string][] {
  return [
    [
      request.id,
      `["${request.contentType}",[["zh-TW","TW",["FINANCE_TOP_INDICES","WEB_TEST_1_0_0"],null,null,1,1,"${languageAndRegion}"]]]`,
    ],
  ];
}

export async function getTopStoriesNews(languageAndRegion: string): Promise<NewsTopicItem[]> {
  const responseArray = await fetchNews(createRequestBody(topicRequestCode.topStories, languageAndRegion));
  const newsTopicOuterObject = JSON.parse(responseArray[0][2]);

  const topNewsObject = newsTopicOuterObject[1][3];
  const featuredNewsObject = newsTopicOuterObject[1][5];

  const topNewsObjectItems: [] = topNewsObject[1];
  const topNewsItems: NewsItem[] = topNewsObjectItems.map((newsObjectItem) => {
    const newsObject = newsObjectItem[0]?.[0] || newsObjectItem[1];
    const newsItem = parseNewsItem(newsObject);
    const hasSubNewsObjects = !!newsObjectItem[0]?.[0] && !!(newsObjectItem[0]?.[1] as [])?.length;
    if (hasSubNewsObjects) {
      newsItem.relatedNewsItems = (newsObjectItem[0][1] as []).map((item) => parseNewsItem(item[0]));
    }
    return newsItem;
  });

  const featuredNewsObjectItems: [] = featuredNewsObject[1];
  const featuredNewsItems: NewsItem[] = featuredNewsObjectItems.map((newsObjectItem) =>
    parseNewsItem(newsObjectItem[0]),
  );

  return [
    {
      id: (topNewsObject[2][1] as string).split('/')[1],
      name: topNewsObject[0][1],
      newsItems: [...topNewsItems, ...featuredNewsItems],
      isPartial: false,
    },
  ];
}

export async function getRecommendedNews(languageAndRegion: string): Promise<NewsTopicItem> {
  const responseArray = await fetchNews(createRequestBody(topicRequestCode.recommended, languageAndRegion));
  const newsTopicOuterObject = JSON.parse(responseArray[0][2]);
  const newsTopicObject = newsTopicOuterObject[1];
  const newsObjectItems: [] = newsTopicObject[2];
  const newsItems: NewsItem[] = newsObjectItems.map((newsObjectItem) => parseNewsItem(newsObjectItem[0]));
  return {
    id: 'for_you',
    name: newsTopicObject[0],
    newsItems,
    isPartial: false,
  };
}

export async function getAllTopicsNews(languageAndRegion: string): Promise<NewsTopicItem[]> {
  const responseArray = await fetchNews(createRequestBody(topicRequestCode.allTopics, languageAndRegion));
  const newsTopicOuterObject = JSON.parse(responseArray[0][2]);
  const newsTopicObjects: [] = newsTopicOuterObject[1][1];

  return newsTopicObjects.map((topicObject) => {
    const newsObjects: [] = topicObject[1];
    const newsItems = newsObjects.flatMap((newsObject) => {
      return newsObject[0]?.[0] === NewsObjectType.SingleNews ? [parseNewsItem(newsObject[0])] : [];
    });
    return {
      id: (topicObject[2][1] as string).split('/')[1],
      name: topicObject[0],
      newsItems,
      isPartial: true,
    };
  });
}

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
