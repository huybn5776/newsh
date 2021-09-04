import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/news/:topic?', component: () => import('@views/NewsList/NewsList.vue'), name: 'news' },
  { path: '/:catchAll(.*)', redirect: { name: 'news' } },
];

const route = createRouter({
  history: createWebHistory(),
  routes,
});

export default route;
