import axios from 'axios';

export async function getUserLanguageAndRegionFromRss(): Promise<string | null> {
  const response = await axios.get('/news.google.com/news/rss');
  const matches: RegExpExecArray | null = /ceid=((\\w+):([a-zA-Z\\-]+))/.exec(response.data);
  return matches?.[1] || null;
}
