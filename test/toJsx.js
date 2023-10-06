const { JSDOM } = require('jsdom');
const prettierFormat = require('./format');

const JSX_ATTRIBUTES = [
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
];
const ATTRIBUTE_TO_JSX_PROP_MAP = JSX_ATTRIBUTES.reduce(
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
async function toJsx(html) {
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

  try {
    let formatted = await prettierFormat(result, { parser: 'babel' });

    // fix lowercased attributes
    // const regexAttr = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/gmi
    for (const attr in ATTRIBUTE_TO_JSX_PROP_MAP) {
      const jsxattr = ATTRIBUTE_TO_JSX_PROP_MAP[attr];
      const regex = new RegExp(attr + '=', 'gm');
      formatted = formatted.replace(regex, jsxattr + '=');
      // console.log(regex, jsxattr);
    }

    return formatted;
  } catch (e) {
    console.error('toJsx', 'prettier fail', e);
    return result;
  }
}

module.exports = toJsx;

if (require.main === module) {
  require('./test-jsx');
}
