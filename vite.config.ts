/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig, Alias } from 'vite';

import * as tsconfig from './tsconfig.json';

function readAliasFromTsConfig(): Alias[] {
  const pathReplaceRegex = /\/\*$/;
  return Object.entries(tsconfig.compilerOptions.paths).reduce((aliases, [fromPaths, toPaths]) => {
    const find = fromPaths.replace(pathReplaceRegex, '');
    const toPath = toPaths[0].replace(pathReplaceRegex, '');
    const replacement = path.resolve(__dirname, toPath);
    aliases.push({ find, replacement });
    return aliases;
  }, [] as Alias[]);
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: readAliasFromTsConfig(),
  },
  server: {
    proxy: {
      '/news.google.com': {
        target: 'https://news.google.com',
        rewrite(urlPath) {
          return urlPath.replace(/^\/news.google.com/, '');
        },
        changeOrigin: true,
        followRedirects: true,
      },
    },
  },
});
