import { JSDOM } from 'jsdom';

/**
 * html fixer
 * @param  html
 * @returns fail=empty string
 */
function fixHtml(html: string) {
  const dom = new JSDOM(html);
  html = dom.serialize();

  // writefile(tmp('fixHtml/fixed.html'), html);

  dom.window.close();
  const regex_body_tag = /<body\b[^>]*>([\s\S]*?)<\/body\b[^>]*>/gim;
  const exec = regex_body_tag.exec(html);
  if (exec) return exec[1];
  return '';
}

export default fixHtml;
