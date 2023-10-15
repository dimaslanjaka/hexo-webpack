# Hexo with webpack
generate static site jekyll/hexo/huge markdown posts using webpack

## Advantages
- reduce site size (useful for github pages)
- SEO improvement by setting html metadata then add `<script>` tag to main bundle.js

## Features
- markdown string to react jsx element converter
- html string to react jsx element converter

## Structure folders

- folder `src-posts` source markdown post
- folder `source/_posts` auto generated post from `src-posts` using `sbg post copy`

## Installation

- install

```bash
yarn install
echo {} > _config.json
echo [] > route.json
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