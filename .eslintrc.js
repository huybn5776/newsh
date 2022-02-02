module.exports = {
  env: {
    es2020: true,
    browser: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/eslint-config-typescript',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'import', 'jsx-a11y'],
  ignorePatterns: ['dist/**', '.eslintrc.js', 'config-overrides.js'],
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly',
  },
  rules: {
    // override rule from 'plugin:@typescript-eslint/recommended'
    'react/jsx-filename-extension': 0,

    'import/order': [
      2,
      {
        groups: ['builtin', 'external', 'internal'],
        pathGroups: [
          {
            pattern: 'vue',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@+(api|components|compositions|directives|enums|interfaces|services|utils|views)/**',
            group: 'internal',
          },
          {
            pattern: '@/**',
            group: 'internal',
          },
          {
            pattern: '*.scss',
            group: 'index',
            patternOptions: { matchBase: true },
          },
        ],
        pathGroupsExcludedImportTypes: ['vue'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    '@typescript-eslint/explicit-function-return-type': [
      1,
      {
        allowExpressions: true,
      },
    ],
    '@typescript-eslint/lines-between-class-members': 0,
    '@typescript-eslint/no-use-before-define': 0,

    'class-methods-use-this': 0,
    'import/prefer-default-export': 0,
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'no-console': [1, { allow: ['warn', 'error'] }],
    'no-continue': 0,
    'no-multiple-empty-lines': 2,
    'no-return-assign': [2, 'except-parens'],
    'no-useless-return': 1,
    'prettier/prettier': 1,
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    semi: [2, 'always'],

    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        some: ['nesting', 'id'],
        labelComponents: [],
        labelAttributes: [],
        controlComponents: [],
        depth: 25,
      },
    ],
    'jsx-a11y/no-static-element-interactions': 0,

    'vue/component-tags-order': [
      'error',
      {
        order: ['template', 'script', 'style'],
      },
    ],
  },
};
