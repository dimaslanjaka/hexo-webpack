const { JSDOM } = require('jsdom');
const { format } = require('prettier');

const ATTRIBUTE_TO_JSX_PROP_MAP = [
  'allowFullScreen',
  'allowTransparency',
  'autoComplete',
  'autoFocus',
  'autoPlay',
  'cellPadding',
  'cellSpacing',
  'charSet',
  'className',
  'classId',
  'colSpan',
  'contentEditable',
  'contextMenu',
  'crossOrigin',
  'encType',
  'formAction',
  'formEncType',
  'formMethod',
  'formNoValidate',
  'formTarget',
  'frameBorder',
  'hrefLang',
  'inputMode',
  'keyParams',
  'keyType',
  'marginHeight',
  'marginWidth',
  'maxLength',
  'mediaGroup',
  'minLength',
  'noValidate',
  'radioGroup',
  'readOnly',
  'rowSpan',
  'spellCheck',
  'srcDoc',
  'srcLang',
  'srcSet',
  'tabIndex',
  'useMap'
].reduce(
  (obj, x) => {
    obj[x.toLowerCase()] = x;
    return obj;
  },
  { for: 'htmlFor', class: 'className' }
);
const CONFLICT_SYMBOLS = {
  '{{': '{`{{`}',
  '}}': '{`}}`}'
};
const DO_NOT_PROCESS_HTML_ELEMENTS = ['style', 'script'];

function getAttrObj(element) {
  const attrsObj = {};
  const attrs = [...element.attributes];
  for (let attr of attrs) {
    attrsObj[attr.name] = attr.value;
  }
  return attrsObj;
}

/**
 * transform html to jsx
 * @param {string} html
 */
function toJsx(html) {
  const dom = new JSDOM(html);
  const { window } = dom;
  const { document } = window;
  document.querySelectorAll('*').forEach(el => {
    if (DO_NOT_PROCESS_HTML_ELEMENTS.includes(el.tagName.toLowerCase())) return;
    const attributes = getAttrObj(el);

    for (const key in attributes) {
      const value = attributes[key];
      if (ATTRIBUTE_TO_JSX_PROP_MAP[key]) {
        if (el.hasAttribute(key)) {
          el.setAttribute(ATTRIBUTE_TO_JSX_PROP_MAP[key], value);
          el.removeAttribute(key);
        }
      }
    }
  });

  let newHtml = document.body.innerHTML;
  const repsingle = function (_, ...groups) {
    return groups[0] + ' />';
  };
  // fix unclosed img tag
  // newHtml = newHtml.replace(/(<img("[^"]*"|[^>])+)(?<!\/)>/gm, repsingle);
  const tags = [
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
  ];
  tags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*)>`, 'g');
    newHtml = newHtml.replace(regex, `<${tag}$1/>`);
  });
  // fix unclosed br tag
  newHtml = newHtml.replace(/(<br("[^"]*"|[^>])+)(?<!\/)>/gm, repsingle);
  newHtml = newHtml.replace(/(<br)(?<!\/)>/gm, repsingle);
  // escape code tag
  // newHtml = newHtml.replace(/(<code\b[^>]*>)([\s\S]*?)(<\/code\b[^>]*>)/gm, function (_, open, inner, close) {
  //   return `${open}{\`${inner.replace('$', '\\$')}\`}${close}`;
  // });
  // newHtml = /<body\s[^>]*>(.*?)<\/body>/gi.exec(newHtml)[1];
  for (const key in CONFLICT_SYMBOLS) {
    const unicoded = CONFLICT_SYMBOLS[key];
    newHtml = newHtml.replace(new RegExp(key, 'gm'), unicoded);
  }

  const result = `
import React from 'react';

export default function () {
  return (<>${newHtml}</>)
}
  `.trim();

  window.close();

  return format(result, { parser: 'babel' });
}

module.exports.toJsx = toJsx;
module.exports = toJsx;

if (require.main === module) {
  require('./test');
}
