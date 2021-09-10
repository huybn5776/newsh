import axios from 'axios';

export async function getUserLanguageAndRegionFromRss(): Promise<string | null> {
  const response = await axios.get('/news.google.com/news/rss');
  const regExp = new RegExp('ceid=((\\w+):([a-zA-Z\\-]+))');
  const matches: RegExpExecArray | null = regExp.exec(response.data);
  return matches?.[1] || null;
}
