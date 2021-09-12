import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';

import { validateIsNewsInfoSettings } from '@services/news-service';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', redirect: { name: 'news' } },
  {
    path: '/news/:topicId?',
    component: () => import('@views/NewsList/NewsList.vue'),
    name: 'news',
    beforeEnter: (to, from, next) => {
      if (validateIsNewsInfoSettings()) {
        next(true);
      } else {
        next('setup');
      }
    },
  },
  { path: '/settings', component: () => import('@views/SettingsPage/SettingsPage.vue'), name: 'settings' },
  { path: '/setup', component: () => import('@views/SetupPage/SetupPage.vue'), name: 'setup' },
  { path: '/:catchAll(.*)', redirect: { name: 'news' } },
];

const route = createRouter({
  history: createWebHistory(),
  routes,
});

export default route;
