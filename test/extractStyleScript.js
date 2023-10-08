const { parsePost, parsePostFM } = require('hexo-post-parser');
const { RenderMarkdownBody } = require('hexo-post-parser/dist/markdown/renderBodyMarkdown');
const { writefile } = require('sbg-utility');

async function main() {
  const source = __dirname + '/fixtures/jsx-conflict.md';
  const post = (await parsePost(source)) || parsePostFM(source);

  const md = new RenderMarkdownBody(post);
  // extract code block first
  md.extractCodeBlock()
    // extract style, script
    .extractStyleScript();
  writefile(__dirname + '/tmp/extract.html', md.getContent());
}

main();
