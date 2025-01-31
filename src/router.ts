import { createWebHistory, createRouter, RouteRecordRaw, NavigationGuardWithThis } from 'vue-router';

import { validateIsNewsInfoSettings } from '@/services/news-service';

const newsPageGuard: NavigationGuardWithThis<undefined> = (to, from, next) => {
  if (validateIsNewsInfoSettings()) {
    next(true);
  } else {
    next('setup');
  }
};

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', redirect: { name: 'topStories' } },
  {
    path: '/news/topStories',
    component: () => import('@/modules/news-list/TopStoriesPage.vue'),
    name: 'topStories',
    beforeEnter: newsPageGuard,
  },
  {
    path: '/news/:topicId',
    component: () => import('@/modules/news-list/NewsTopicPage.vue'),
    name: 'newsTopic',
    beforeEnter: newsPageGuard,
  },
  { path: '/settings', component: () => import('@/modules/settings/SettingsPage.vue'), name: 'settings' },
  { path: '/setup', component: () => import('@/modules/setup/SetupPage.vue'), name: 'setup' },
  { path: '/:catchAll(.*)', redirect: { name: 'topStories' } },
];

const route = createRouter({
  history: createWebHistory(),
  routes,
});

export default route;
