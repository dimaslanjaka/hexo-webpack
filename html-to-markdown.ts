import hpp from 'hexo-post-parser';
import TurndownService from 'turndown';

const file = 'src-posts/2019/12/related-post-blogger-support-webp.md';
hpp
  .parsePost(file, {
    sourceFile: file
  })
  .then(result => {
    if (!result.body) return console.error('fail render', file);
    if (!result.body) return console.error('fail render', file);
    const turndownService = new TurndownService();
    turndownService.keep(['script', 'ins', 'iframe', 'style']);
    const markdown = turndownService.turndown(result.body);
    console.log(markdown);
  });
