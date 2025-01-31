import { SeenNewsItem } from '@/interfaces/seen-news-item';

export enum EventKey {
  RemoteSeenNews = 'remoteSeenNews',
}

export type EventValueType = {
  remoteSeenNews: SeenNewsItem[];
};
