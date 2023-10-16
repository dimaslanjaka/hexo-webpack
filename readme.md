# Hexo with webpack
generate static site jekyll/hexo/huge markdown posts using webpack

## Advantages
- reduce site size (useful for github pages with limit **1GB** only)
- SEO improvement by setting html metadata then add `<script>` tag to main bundle.js

## Features
- markdown string to react jsx element converter
- html string to react jsx element converter

## Structure folders and files

- `.cache` webpack cache directory and post map json from `gulp map`
- `source` all page assets and markdowns (ex: source/about.md -> http://example.com/about)
- `public` all static assets (no markdown should be processed)
- `src` all layout react, scss, css
- `src-posts` source markdown post
- `source/_posts` auto generated post from `src-posts` using `sbg post copy`
- `tmp` temp folder
- `tmp/meta` all parsed metadata post
- `tmp/static` all SEO optimized static html
  > all generated html should be processed with `gulp build-html` later
- `_config.json` auto generated file from `_config.yml` with additional properties
- `routes.json` auto generated file from all mapped posts and pages

![editor preview](https://github.com/dimaslanjaka/hexo-webpack/assets/12471057/0e3b4e79-afa8-4cda-9818-e022bf5bc28d)
![web preview](https://github.com/dimaslanjaka/hexo-webpack/assets/12471057/747cdc5d-031e-4c69-a62b-d4acce1e4781)


## Installation

- install

```bash
yarn install
echo {} > _config.json
echo [] > route.json
mkdir -p tmp
mkdir -p tmp/meta
mkdir -p tmp/static
mkdir -p src/posts
```

- copy source post

```bash
npx sbg post copy
```

- run standalone scripts

```bash
npx sbg post standalone
```

- mapping source posts

```bash
gulp map
```

- generate routes
> you can override options by cli arguments see: [gulpfile.genr.ts#L17](https://github.com/dimaslanjaka/hexo-webpack/blob/e596be2c5df1a2d53ba0e2e3b3721d3dc8d7a4fa/gulpfile.genr.ts#L17)
```bash
gulp route
```

## site production build

```bash
yarn run build
```

## watch production build

terminal 1
```bash
yarn run php
```

> listening dist folder at `http://localhost:4000`

terminal 2
```bash
gulp build-watch
```

> watching `src`, `public`, `source` folders then run build production

## Q&A

### Why webpack error file not found

you can noticing webpack to rebuild by

```bash
gulp notice
```

## RoadMap

<!--
|&check;|_|&cross;|
|&#x2611;|&#x2610;|&#x2612;|
-->

| Status | Goal | Date |
| :---: | :--- | --- |
| &#x2611; | sync configuration setup webpack, typescript, babel, react | 09/2023 |
| &#x2611; | create markdown to JSX react converter | 09/2023 |
| &#x2611; | create SEO static html for posts | 09/2023 |
| &#x2611; | mapping and populate markdown posts | 09/2023 |
| &#x2610; | mapping and populate markdown pages from `source` folder | - |
| &#x2610; | complete layout using `flowbite-react` | - |
| &#x2610; | generate yoast seo sitemaps | - |
| &#x2610; | generate atom/feeds | - |
| &#x2610; | localization (multi languages) | - |
