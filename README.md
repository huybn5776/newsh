# Newsh

A news site that uses Google News as a source and provides some custom features for it.

## Features

- Always open news with new tab, prevent losing the current reading list/location when reading news on the phone.
- Collapse topic that you may not be interested on it.
- Filter out YouTube news, when it is not suitable to watch with sound.
- Gray out seen news, free your short-term memory to remember what news you may like to skip.
- Hide news source/term without login with Google account.
- Load headline or specific topic when react the bottom of all news, no need to scroll to top and click "More Headlines" or something again, will also filter out already listed news above.
- Backup settings.



## Implementation detail

### News source

Fetch news from the api that Google News ui use `https://news.google.com/_/DotsSplashUi/data/batchexecute`, parse its response data to get useful info of it.

With three different request bodies, we can get partial news of news topics (4 or 6 news per topic) with three sections: 

- headline
- nation, world
- business, technology, entertainment, sports, science, health

Every topic have an id, we can use this id to get the full news of the topic.

All of those task is done on client side, so proxy is required to bypass CORS error.

### Language & region

To get news from Google News api, we need to pass a language and region code to request body, for example, US news will be "US:en". It can be easily obtained when open Google News website, and it will redirect to your local region news with `ceid` url params like `https://news.google.com/topstories?hl=en-US&gl=US&ceid=US:en`. But with proxy it can't be done by this because redirected request will not apply proxy rule to it (it will start with `https://news...` but only `/news...`), and CORS error will occur.

So in implement here is using a geolocation api service, to use user ip address to obtain user's current location country, get full language & region list from Google News api, and then filter it out to find one match. If in case it not match to single region, a selection will show up for user to select. It only needed when user first visit this site.

### Gray out seen news

Use IntersectionObserver, after a news row enter to viewport for 2 seconds, the news will be mark news as seen.
