import fs from 'fs';
import { renderBodyMarkdown } from 'hexo-post-parser/dist/markdown/toHtml';

const src = __dirname + '/tmp/body.html';
console.log(src);
const html = fs.readFileSync(src, 'utf-8');
const react = `
export default function (props) {
  return ${sanitize(html)}
}
`;

function sanitize(body: string) {
  body = renderBodyMarkdown(
    {
      body,
      rawbody: body
    },
    true
  );
  return body;
}
