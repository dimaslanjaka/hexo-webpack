import { JSDOM } from 'jsdom';
import prettierFormat from './format';

/**
 * html fixer
 * @param {string} html
 * @returns
 */
async function fixHtml(html) {
  const dom = new JSDOM(html);
  html = dom.serialize();

  // writefile(tmp('fixHtml/fixed.html'), html);

  dom.window.close();
  const regex_body_tag = /<body\b[^>]*>([\s\S]*?)<\/body\b[^>]*>/gim;
  const exec = regex_body_tag.exec(html);
  return await prettierFormat(exec[1], { parser: 'html' });
}

export default fixHtml;
