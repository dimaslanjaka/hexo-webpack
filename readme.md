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
```

- copy source post

```bash
npx sbg post copy
```

- run standalone scripts

```bash
npx sbg post standalone
```