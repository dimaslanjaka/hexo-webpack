# Jekyll with webpack
generate static site jekyll/hexo/huge markdown posts using webpack

- folder `src-posts` source markdown post
- folder `source/_posts` auto generated post from `src-posts` using `sbg post copy`

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